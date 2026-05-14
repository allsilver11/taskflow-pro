# 05-conventions.md — 협업 규칙

---

## 명명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 백엔드 변수·함수·파일명 | `snake_case` | `task_id`, `get_task_list`, `task_router.py` |
| 프론트 변수·함수 | `camelCase` | `taskId`, `getTaskList`, `renderCard` |
| 프론트 컴포넌트 함수 | `PascalCase` | `TaskCard`, `AddTaskForm`, `ThemeToggle` |
| 상수 | `UPPER_SNAKE_CASE` | `MAX_TITLE_LENGTH`, `POLL_INTERVAL_MS` |
| CSS 클래스 (커스텀) | `kebab-case` | `task-card`, `status-badge` |

**언어 규칙**
- 코드 내 모든 **식별자**(변수명, 함수명, 파일명, 클래스명)는 **영어**로 작성한다.
- **주석**은 **한국어**로 작성한다.
- 커밋 메시지 본문 요약은 **한국어**로 작성한다.

---

## 금지 패턴

| 금지 | 이유 | 대안 |
|------|------|------|
| `print()` 디버깅 | 운영 환경 로그에 노이즈를 남기고, 제거를 잊으면 민감 정보가 노출된다 | Python `logging` 모듈 사용 (`logger.debug`, `logger.info`) |
| `bare except:` | 모든 예외를 무조건 삼켜 실제 오류를 숨긴다. 디버깅이 불가능해진다 | `except SpecificError as e:` 로 예외 타입을 명시한다 |
| 시크릿 하드코딩 | API 키·비밀번호가 git 이력에 영구적으로 남아 보안 사고로 이어진다 | `.env` 파일에 보관하고 `os.getenv('KEY_NAME')`으로 주입, `.env.example`에 키 이름만 기록 |
| TypeScript `any` 타입 | 타입 시스템의 의미를 잃어 런타임 오류를 컴파일 타임에 잡지 못한다 | 명시적 타입 또는 `unknown` 사용, 불가피하면 `// TODO: 타입 보강` 주석 추가 |
| CSS `!important` | 우선순위 계층이 꼬여 나중에 덮어쓰기가 불가능해진다 | 셀렉터 구체성을 높이거나 Tailwind 유틸리티 클래스 순서를 조정한다 |

---

## 폴더 구조

```
taskflow-pro/
├── backend/
│   ├── main.py            # FastAPI 앱 진입점
│   ├── database.py        # DB 세션 및 초기화
│   ├── models.py          # SQLAlchemy 모델
│   ├── schemas.py         # Pydantic 스키마
│   ├── routers/
│   │   └── tasks.py       # /api/v1/tasks 라우터
│   ├── tests/
│   │   └── test_tasks.py  # pytest 테스트
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── index.html         # 단일 HTML 진입점
│   ├── app.js             # 메인 JS 모듈
│   └── style.css          # 커스텀 CSS (Tailwind 보완용)
├── docs/
│   ├── 00-overview.md
│   ├── 01-product.md
│   ├── 02-specs.md
│   ├── 03-design.md
│   ├── 04-tasks.md
│   └── 05-conventions.md
├── .gitignore
├── CLAUDE.md
└── README.md
```

폴더 구조를 변경하려면 이 문서를 먼저 수정하고 사용자 승인을 받는다. (`03-design.md` 절대 규칙 5번)

---

## 테스트 규칙

- 테스트 프레임워크: **pytest**
- 위치: `backend/tests/test_tasks.py`
- 기능 구현 후 해당 엔드포인트 테스트가 없으면 완료로 간주하지 않는다.

**필수 테스트 케이스**

| 엔드포인트 | 정상 케이스 | 오류 케이스 |
|------------|-------------|-------------|
| `POST /api/v1/tasks` | 201 + 생성된 객체 반환 | `title` 누락 → 400 |
| `GET /api/v1/tasks` | 200 + 배열 반환 | — |
| `GET /api/v1/tasks/{id}` | 200 + `description` 포함 | 없는 id → 404 |
| `PUT /api/v1/tasks/{id}` | 200 + 수정된 객체 반환 | 없는 id → 404, 잘못된 `status` → 400 |
| `DELETE /api/v1/tasks/{id}` | 204 + 본문 없음 | 없는 id → 404 |

---

## Git 커밋 규칙

### 타입 prefix

| 타입 | 사용 상황 |
|------|-----------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서 작성·수정 |
| `refactor` | 동작 변경 없이 코드 구조 개선 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드 설정, 의존성, `.gitignore` 등 |

### 형식

```
<타입>: <한국어 요약 (50자 이내)>
```

**예시**

```
feat: POST /api/v1/tasks 엔드포인트 구현
fix: due_at 400 검증 누락 수정
docs: 03-design.md 의존성 추가 이력 업데이트
test: tasks 라우터 404 케이스 테스트 추가
chore: requirements.txt SQLAlchemy 버전 고정
```

### 규칙

- 요약은 **한국어**로, 명령형으로 작성한다 ("구현했다" → "구현")
- 한 커밋에 하나의 관심사만 담는다
- WIP(작업 중) 상태로 커밋하지 않는다
- 시크릿이 포함된 파일(`.env`)을 절대 커밋하지 않는다
