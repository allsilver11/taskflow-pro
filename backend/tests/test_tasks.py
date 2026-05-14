import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# 테스트 전용 인메모리 SQLite DB
_TEST_DB_URL = "sqlite:///./test_taskflow.db"
_engine = create_engine(_TEST_DB_URL, connect_args={"check_same_thread": False})
_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    """각 테스트 전후로 테이블 재생성"""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


client = TestClient(app)


# ── POST /api/v1/tasks ────────────────────────────────────────────
class TestCreateTask:
    def test_success_returns_201(self):
        res = client.post("/api/v1/tasks", json={"title": "신규 업무"})
        assert res.status_code == 201
        body = res.json()
        assert body["title"] == "신규 업무"
        assert body["status"] == "todo"
        assert "description" in body

    def test_with_all_fields(self):
        res = client.post("/api/v1/tasks", json={
            "title": "전체 필드",
            "description": "설명",
            "status": "in_progress",
            "due_at": "2026-05-12T18:00:00Z",
        })
        assert res.status_code == 201
        assert res.json()["due_at"] is not None

    def test_missing_title_returns_400(self):
        res = client.post("/api/v1/tasks", json={"status": "todo"})
        assert res.status_code == 400
        assert res.json()["error"] == "VALIDATION_ERROR"

    def test_empty_title_returns_400(self):
        res = client.post("/api/v1/tasks", json={"title": ""})
        assert res.status_code == 400

    def test_title_too_long_returns_400(self):
        res = client.post("/api/v1/tasks", json={"title": "a" * 201})
        assert res.status_code == 400

    def test_invalid_status_returns_400(self):
        res = client.post("/api/v1/tasks", json={"title": "업무", "status": "unknown"})
        assert res.status_code == 400

    def test_invalid_due_at_format_returns_400(self):
        res = client.post("/api/v1/tasks", json={"title": "업무", "due_at": "not-a-date"})
        assert res.status_code == 400


# ── GET /api/v1/tasks ─────────────────────────────────────────────
class TestListTasks:
    def test_empty_list(self):
        res = client.get("/api/v1/tasks")
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_list_without_description(self):
        client.post("/api/v1/tasks", json={"title": "업무1", "description": "설명"})
        res = client.get("/api/v1/tasks")
        assert res.status_code == 200
        assert "description" not in res.json()[0]

    def test_status_filter(self):
        client.post("/api/v1/tasks", json={"title": "할 일", "status": "todo"})
        client.post("/api/v1/tasks", json={"title": "진행 중", "status": "in_progress"})
        res = client.get("/api/v1/tasks?status=todo")
        assert res.status_code == 200
        items = res.json()
        assert len(items) == 1
        assert items[0]["status"] == "todo"


# ── GET /api/v1/tasks/{id} ────────────────────────────────────────
class TestGetTask:
    def test_success_includes_description(self):
        create_res = client.post("/api/v1/tasks", json={"title": "단건", "description": "내용"})
        task_id = create_res.json()["id"]
        res = client.get(f"/api/v1/tasks/{task_id}")
        assert res.status_code == 200
        assert res.json()["description"] == "내용"

    def test_not_found_returns_404(self):
        res = client.get("/api/v1/tasks/9999")
        assert res.status_code == 404


# ── PUT /api/v1/tasks/{id} ────────────────────────────────────────
class TestUpdateTask:
    def test_partial_update_preserves_other_fields(self):
        create_res = client.post("/api/v1/tasks", json={"title": "원본 제목", "status": "todo"})
        task_id = create_res.json()["id"]
        res = client.put(f"/api/v1/tasks/{task_id}", json={"status": "in_progress"})
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "in_progress"
        assert body["title"] == "원본 제목"  # 변경하지 않은 필드 유지 확인

    def test_not_found_returns_404(self):
        res = client.put("/api/v1/tasks/9999", json={"status": "done"})
        assert res.status_code == 404

    def test_invalid_status_returns_400(self):
        create_res = client.post("/api/v1/tasks", json={"title": "업무"})
        task_id = create_res.json()["id"]
        res = client.put(f"/api/v1/tasks/{task_id}", json={"status": "invalid"})
        assert res.status_code == 400


# ── DELETE /api/v1/tasks/{id} ─────────────────────────────────────
class TestDeleteTask:
    def test_success_returns_204(self):
        create_res = client.post("/api/v1/tasks", json={"title": "삭제 대상"})
        task_id = create_res.json()["id"]
        res = client.delete(f"/api/v1/tasks/{task_id}")
        assert res.status_code == 204
        assert res.content == b""

    def test_deleted_task_not_found(self):
        create_res = client.post("/api/v1/tasks", json={"title": "삭제 후 확인"})
        task_id = create_res.json()["id"]
        client.delete(f"/api/v1/tasks/{task_id}")
        res = client.get(f"/api/v1/tasks/{task_id}")
        assert res.status_code == 404

    def test_not_found_returns_404(self):
        res = client.delete("/api/v1/tasks/9999")
        assert res.status_code == 404
