# 02-specs.md — 기술 명세

## Task 데이터 모델

### 필드 정의

| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | INTEGER | PK, AUTO INCREMENT | 고유 식별자 |
| `title` | VARCHAR(200) | NOT NULL | 업무 제목 (필수) |
| `description` | TEXT | NULL 허용 | 업무 상세 설명 |
| `status` | ENUM | NOT NULL, 기본값 `todo` | 업무 상태 |
| `due_at` | DATETIME | NULL 허용, UTC | 마감 일시 |
| `created_at` | DATETIME | NOT NULL, UTC | 생성 일시 (자동) |
| `updated_at` | DATETIME | NOT NULL, UTC | 수정 일시 (자동) |

### status 허용 값

| 값 | 화면 레이블 |
|----|-------------|
| `todo` | 할 일 |
| `in_progress` | 진행 중 |
| `done` | 완료 |

### DDL (참고용)

```sql
CREATE TABLE tasks (
  id          INTEGER      PRIMARY KEY AUTOINCREMENT,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  status      VARCHAR(20)  NOT NULL DEFAULT 'todo'
                           CHECK(status IN ('todo', 'in_progress', 'done')),
  due_at      DATETIME,
  created_at  DATETIME     NOT NULL DEFAULT (datetime('now')),
  updated_at  DATETIME     NOT NULL DEFAULT (datetime('now'))
);
```

---

## 검증 규칙

### 400 Bad Request — 입력 오류

| 조건 | 응답 |
|------|------|
| `title` 누락 또는 빈 문자열 | 400 |
| `title` 길이 200자 초과 | 400 |
| `status` 허용 값 외 문자열 | 400 |
| `due_at` ISO 8601 형식 불일치 | 400 |

**`due_at` 허용 형식 (ISO 8601)**
```
2026-05-12T18:00:00Z        ← UTC 명시
2026-05-12T18:00:00+09:00   ← 타임존 오프셋
2026-05-12T09:00:00.000Z    ← 밀리초 포함
```
저장 시 UTC로 정규화한다. 형식이 맞지 않으면 400을 반환한다.

### 404 Not Found — 리소스 없음

| 조건 | 응답 |
|------|------|
| 존재하지 않는 `id`로 단건 조회 | 404 |
| 존재하지 않는 `id`로 수정 요청 | 404 |
| 존재하지 않는 `id`로 삭제 요청 | 404 |

### 오류 응답 형식

```json
{
  "error": "VALIDATION_ERROR",
  "message": "title은 필수입니다.",
  "field": "title"
}
```

---

## REST API

Base URL: `/api/v1`

### 1. 업무 추가

```
POST /api/v1/tasks
```

**Request Body**
```json
{
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백 작성",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z"
}
```

**Response 201**
```json
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백 작성",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-14T03:00:00Z",
  "updated_at": "2026-05-14T03:00:00Z"
}
```

---

### 2. 업무 목록 조회

```
GET /api/v1/tasks
```

- `description` 필드 **제외** (목록 성능 최적화)
- 기본 정렬: `created_at DESC`

**Query Parameters (선택)**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `status` | string | 상태 필터 (`todo`, `in_progress`, `done`) |

**Response 200**
```json
[
  {
    "id": 1,
    "title": "디자인 시안 검토",
    "status": "todo",
    "due_at": "2026-05-12T18:00:00Z",
    "created_at": "2026-05-14T03:00:00Z",
    "updated_at": "2026-05-14T03:00:00Z"
  }
]
```

---

### 3. 업무 단건 조회

```
GET /api/v1/tasks/:id
```

- `description` 필드 **포함**

**Response 200**
```json
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백 작성",
  "status": "todo",
  "due_at": "2026-05-12T18:00:00Z",
  "created_at": "2026-05-14T03:00:00Z",
  "updated_at": "2026-05-14T03:00:00Z"
}
```

---

### 4. 업무 수정 (부분 수정)

```
PUT /api/v1/tasks/:id
```

- 보낸 필드만 수정한다. 보내지 않은 필드는 기존 값 유지.
- `id`, `created_at`은 수정 불가.

**Request Body (부분 수정 예시)**
```json
{
  "status": "in_progress",
  "due_at": "2026-05-15T12:00:00Z"
}
```

**Response 200** — 수정된 전체 객체 반환 (`description` 포함)
```json
{
  "id": 1,
  "title": "디자인 시안 검토",
  "description": "피그마 링크 확인 후 피드백 작성",
  "status": "in_progress",
  "due_at": "2026-05-15T12:00:00Z",
  "created_at": "2026-05-14T03:00:00Z",
  "updated_at": "2026-05-14T05:30:00Z"
}
```

---

### 5. 업무 삭제

```
DELETE /api/v1/tasks/:id
```

**Response 204** — 본문 없음

---

### API 요약표

| Method | Endpoint | 응답 코드 | description 포함 |
|--------|----------|-----------|-----------------|
| POST | `/api/v1/tasks` | 201 | O |
| GET | `/api/v1/tasks` | 200 | X |
| GET | `/api/v1/tasks/:id` | 200 | O |
| PUT | `/api/v1/tasks/:id` | 200 | O |
| DELETE | `/api/v1/tasks/:id` | 204 | — |

---

## 화면 명세 (UI)

CRUD 4종 모두 페이지 이동 없이 한 화면에서 완결된다.

### 추가 (Create)

- 화면 상단 또는 고정 위치에 **입력 폼** 노출
- 입력 항목:

| 입력 필드 | 타입 | 필수 여부 | 비고 |
|-----------|------|-----------|------|
| `title` | text input | 필수 | placeholder: "업무 제목을 입력하세요" |
| `due_at` | datetime-local input | 선택 | 분 단위까지 선택 가능 |
| `status` | select | 필수 | 기본값: `todo` |

- 저장 버튼 클릭 → POST 요청 → 목록에 즉시 반영
- 유효성 오류 시 해당 필드 아래 인라인 메시지 표시

---

### 목록 (Read)

- 업무를 **카드** 형태로 나열
- 카드에 표시되는 정보:

| 요소 | 내용 |
|------|------|
| 제목 | `title` |
| 상태 배지 | `status` 값에 따라 색상 구분된 뱃지 |
| 마감 표시 | `D-N HH:MM` 형식 (예: `D-3 18:00`, `D-DAY 09:30`, `D+1` 초과 시 붉게 표시) |
| 수정 트리거 | 카드 클릭 → 수정 모달 오픈 |
| 삭제 버튼 | 카드 우측 상단 휴지통 아이콘 |

- `due_at` 없으면 마감 표시 영역 비워둠

---

### 수정 (Update)

- 카드 클릭 → **모달** 오픈
- 모달 내 수정 가능 항목: `title`, `description`, `status`, `due_at`
- 저장 버튼 클릭 → PUT 요청 → 모달 닫힘 → 카드 즉시 갱신
- 취소 버튼 또는 모달 바깥 클릭 → 변경 사항 폐기

---

### 삭제 (Delete)

- 카드 우측 상단 **휴지통 아이콘** 클릭
- 확인 다이얼로그 표시: "이 업무를 삭제하시겠습니까?"
- 확인 클릭 → DELETE 요청 → 목록에서 즉시 제거
- 취소 클릭 → 아무 동작 없음
