# 04-tasks.md — 개발 로드맵

확장 단계(JWT 로그인, 팀, Kanban 등)는 이 문서에 포함하지 않는다. MVP 완료 후 별도 문서에서 관리한다.

---

## 진행 규칙

| 규칙 | 내용 |
|------|------|
| **순서 준수** | 단계는 반드시 위에서 아래 순서로만 진행한다 |
| **병렬 금지** | 이전 단계 검증이 통과되기 전에 다음 단계를 시작하지 않는다 |
| **검증 필수** | 각 단계의 검증 방법을 실제로 확인한 후 ✅로 표시한다 |
| **상태 표기** | ✅ 완료 / 🔄 진행 중 / ⬜ 대기 |

---

## Phase 1 — 설계 문서 작성

**목표**: 코드 작성 전 모든 의사결정을 문서로 확정한다.

| # | 작업 | 검증 방법 | 상태 |
|---|------|-----------|------|
| 1 | git 저장소 초기화 및 원격(origin) 연결 | `git remote -v` 출력에 `origin` 확인 | ✅ |
| 2 | `.gitignore` 구성 + `README.md` 생성 | `git status`에서 두 파일 추적 확인 | ✅ |
| 3 | `CLAUDE.md` 작성 (역할·절대규칙·모호요청 처리) | 파일 존재 + 5개 절대 규칙 항목 포함 확인 | ✅ |
| 4 | `docs/00-overview.md` 작성 (문서 시스템 안내) | 6개 파일 매핑표 + 읽는 순서 다이어그램 포함 확인 | ✅ |
| 5 | `docs/01-product.md` 작성 (제품 정의) | 페르소나·MVP 범위·성공 기준 5항목 포함 확인 | ✅ |
| 6 | `docs/02-specs.md` 작성 (기술 명세) | Task 모델 7필드·API 5개·화면 명세 포함 확인 | ✅ |
| 7 | `docs/03-design.md` 작성 (설계 결정표) | 8개 결정 항목 + 의존성 추가 정책 포함 확인 | ✅ |
| 8 | `docs/04-tasks.md` 작성 (현재 문서) | Phase 1~3 체크리스트 + 검증 방법 전체 포함 확인 | ✅ |
| 9 | `docs/05-conventions.md` 작성 (협업 규칙) | 폴더 구조·네이밍·브랜치·커밋 규칙 포함 확인 | ⬜ |
| 10 | Phase 1 최종 `git push` + 커밋 이력 확인 | GitHub에서 `docs/` 6개 파일 전체 확인 | ⬜ |

---

## Phase 2 — 백엔드 구현

**목표**: FastAPI로 CRUD API 5개를 구현하고 Swagger UI에서 전체 동작을 검증한다.

| # | 작업 | 검증 방법 | 상태 |
|---|------|-----------|------|
| 1 | `backend/` 폴더 구조 생성 + `requirements.txt` 작성 | 폴더 존재 + `pip install -r requirements.txt` 오류 없음 | ⬜ |
| 2 | Python 가상환경 생성 및 의존성 설치 | `uvicorn --version` 출력 확인 | ⬜ |
| 3 | FastAPI 앱 진입점 `main.py` 생성 + 서버 기동 | `http://localhost:8000/docs` Swagger UI 열림 확인 | ⬜ |
| 4 | SQLAlchemy `Task` 모델 정의 (`02-specs.md` 7필드 기준) | `tasks` 테이블 자동 생성 + 필드 일치 확인 | ⬜ |
| 5 | DB 초기화 (`database.py`) + `.env` / `.env.example` 작성 | 서버 재기동 후 DB 파일 생성 확인, `.env`가 `.gitignore`에 포함 확인 | ⬜ |
| 6 | `POST /api/v1/tasks` 구현 | Swagger에서 요청 → 201 응답 + DB 레코드 생성 확인 | ⬜ |
| 7 | `GET /api/v1/tasks` 구현 (목록, `description` 제외) | Swagger에서 요청 → 200 + 응답에 `description` 없음 확인 | ⬜ |
| 8 | `GET /api/v1/tasks/{id}` 구현 (단건, `description` 포함) | Swagger에서 요청 → 200 + `description` 포함 확인, 없는 id → 404 확인 | ⬜ |
| 9 | `PUT /api/v1/tasks/{id}` 구현 (부분 수정) | Swagger에서 일부 필드만 전송 → 200 + 나머지 필드 유지 확인 | ⬜ |
| 10 | `DELETE /api/v1/tasks/{id}` 구현 + 검증 규칙 전체 확인 | Swagger에서 삭제 → 204 확인, 잘못된 `due_at` → 400 확인, `git push` | ⬜ |

---

## Phase 3 — 프론트엔드 구현

**목표**: Vanilla JS + Tailwind으로 메인 화면을 완성하고 API와 연결한 뒤 성공 기준 5항목을 검증한다.

| # | 작업 | 검증 방법 | 상태 |
|---|------|-----------|------|
| 1 | `frontend/` 폴더 구조 생성 + `index.html` 기본 틀 작성 | 브라우저에서 파일 열기 → 빈 화면 정상 렌더링 확인 | ⬜ |
| 2 | Tailwind CDN 연결 + 디자인 토큰 적용 (`rounded-xl`, `shadow-lg`, `backdrop-blur`, 시스템 폰트, 터치 타깃 44px) | DevTools에서 Tailwind 클래스 적용 확인 | ⬜ |
| 3 | 라이트/다크 테마 토글 구현 (`localStorage('theme')`, 초기값 `prefers-color-scheme`) | 토글 후 새로고침 → 선택 유지 확인 | ⬜ |
| 4 | 업무 추가 폼 구현 (`title`, `due_at`, `status`) + `POST` API 연결 | 폼 제출 → 네트워크 탭에서 201 응답 확인 | ⬜ |
| 5 | 업무 목록 카드 렌더링 구현 (상태 배지 + `D-N HH:MM`) + `GET` API 연결 + 폴링 3초 설정 | 카드 렌더링 확인, 3초마다 `GET` 요청 확인 | ⬜ |
| 6 | 업무 수정 모달 구현 (카드 클릭 → 모달) + `PUT` API 연결 | 수정 저장 후 카드 즉시 갱신 확인 | ⬜ |
| 7 | 업무 삭제 구현 (휴지통 아이콘 → 확인 → `DELETE`) | 삭제 후 카드 목록에서 즉시 제거 확인 | ⬜ |
| 8 | 성공 기준 5항목 최종 검증 + `git push` | 아래 최종 검증 체크리스트 5항목 전체 ✅ 확인 | ⬜ |

---

## Phase 3 최종 검증 체크리스트

| # | 성공 기준 | 검증 방법 |
|---|-----------|-----------|
| 1 | 새로고침 유지 | 테마·목록이 새로고침 후에도 동일하게 표시된다 |
| 2 | 360px 안 깨짐 | Chrome DevTools 360px 설정 후 스크롤·레이아웃 이상 없음 |
| 3 | API 응답 200ms | DevTools Network 탭에서 CRUD 4종 각 요청 응답시간 확인 |
| 4 | CRUD 4종 화면 동작 | 추가·조회·수정·삭제가 페이지 이동 없이 화면에서 완결 |
| 5 | 테마 토글 작동 | 라이트↔다크 전환 후 새로고침해도 선택 유지 |
