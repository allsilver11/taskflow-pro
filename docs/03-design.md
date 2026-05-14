# 03-design.md — 설계 결정

아래 8개 결정은 MVP 범위 안에서 내린 확정 사항이다.
변경이 필요하면 이 문서를 먼저 수정하고, 수정 사유를 기록한 뒤 코드를 바꾼다.

---

## 설계 결정표

### 1. 백엔드 프레임워크

| 항목 | 내용 |
|------|------|
| **선택** | FastAPI |
| **대안** | Django, Express (Node.js) |
| **근거** | 타입 힌트 기반 자동 문서화(OpenAPI), 비동기 지원, 경량 구조. MVP 5개 엔드포인트에 Django의 ORM·Admin·Auth 전체 스택은 과함. Express는 프론트와 언어를 통일할 수 있지만 타입 안전성이 약함. |
| **트레이드오프** | Django에 비해 생태계(플러그인, 어드민)가 작다. 팀이 Python에 익숙하지 않으면 Express보다 온보딩 비용이 높을 수 있다. |

---

### 2. 프론트엔드

| 항목 | 내용 |
|------|------|
| **선택** | Vanilla JS + Tailwind CDN |
| **대안** | React, Vue |
| **근거** | MVP는 단일 페이지·단순 CRUD다. 빌드 도구 없이 HTML 파일 하나로 실행 가능해 초기 설정 비용이 0에 가깝다. Tailwind CDN으로 스타일을 즉시 적용하고, 상태는 모듈 변수로 충분히 관리된다. |
| **트레이드오프** | 컴포넌트 재사용·상태 관리가 복잡해지면 유지보수 비용이 급증한다. 확장(Kanban, 팀 기능) 시점에 React 전환을 검토한다. |

---

### 3. 데이터베이스

| 항목 | 내용 |
|------|------|
| **선택** | SQLite (MVP) → PostgreSQL (확장) + SQLAlchemy ORM |
| **대안** | PostgreSQL 처음부터 도입, MongoDB |
| **근거** | MVP는 단일 사용자 로컬 실행이므로 SQLite로 인프라 없이 시작한다. SQLAlchemy를 추상 레이어로 두어 DB 교체 시 모델 코드 변경을 최소화한다. MongoDB는 관계형 데이터(향후 팀·멤버)에 불리하다. |
| **트레이드오프** | SQLite는 동시 쓰기에 취약하다. 팀 기능 도입 전에 PostgreSQL로 마이그레이션해야 한다. 마이그레이션 타이밍을 놓치면 데이터 이전 비용이 발생한다. |

---

### 4. CSS 방법론

| 항목 | 내용 |
|------|------|
| **선택** | Tailwind CSS 단독 사용 |
| **대안** | styled-components, CSS Modules, 순수 CSS |
| **근거** | 유틸리티 클래스만으로 Mac OS 톤(rounded, shadow, blur)을 HTML에서 직접 표현할 수 있다. 별도 CSS 파일과 HTML을 오가는 컨텍스트 스위칭이 없다. Vanilla JS 환경에서 styled-components는 JS 번들러 없이 사용할 수 없다. |
| **트레이드오프** | 클래스가 길어지면 HTML 가독성이 떨어진다. 디자인 토큰 변경 시 전체 HTML을 수정해야 한다. **styled-components는 이 프로젝트에서 절대 사용하지 않는다.** |

---

### 5. 실시간 동기화

| 항목 | 내용 |
|------|------|
| **선택** | MVP: 3초 폴링 (`setInterval`) |
| **대안** | WebSocket, Server-Sent Events |
| **근거** | MVP는 단일 사용자다. 실시간 충돌 문제가 없으므로 폴링으로 충분하다. WebSocket은 서버 아키텍처 변경(상태 유지 연결 관리)이 필요해 MVP 범위를 벗어난다. |
| **트레이드오프** | 다중 사용자 환경에서는 폴링이 불필요한 요청을 생성한다. 팀 기능 도입 시점에 WebSocket(또는 SSE)으로 교체한다. **WebSocket은 확장 단계까지 보류한다.** |

---

### 6. 프론트엔드 상태 관리

| 항목 | 내용 |
|------|------|
| **선택** | 모듈 변수 + DOM 직접 갱신 |
| **대안** | Redux, Zustand, Pinia, Context API |
| **근거** | Vanilla JS 환경에서 외부 상태 관리 라이브러리는 번들러 없이 사용하기 어렵다. CRUD 5개 엔드포인트 수준의 상태는 `let tasks = []` 같은 모듈 변수로 충분히 관리된다. |
| **트레이드오프** | 상태가 전역 변수에 분산되면 디버깅이 어려워진다. 컴포넌트가 5개를 넘어가는 시점에 React + 상태 관리 라이브러리로 전환을 검토한다. |

---

### 7. 디자인 시스템

| 항목 | 내용 |
|------|------|
| **선택** | Mac OS UI 톤 (자체 정의) |
| **대안** | Material Design, Ant Design |
| **근거** | Material·Ant는 컴포넌트 라이브러리 의존성을 요구하고 고유한 시각 언어를 강제한다. Mac OS 톤은 Tailwind 유틸리티 클래스 조합만으로 구현 가능하며 의존성이 없다. |
| **트레이드오프** | 컴포넌트를 직접 구현해야 하므로 초기 제작 비용이 높다. 접근성(a11y) 처리를 직접 해야 한다. |

**디자인 토큰 (Tailwind 클래스 기준)**

| 토큰 | Tailwind 클래스 | 설명 |
|------|----------------|------|
| 모서리 | `rounded-xl` | 12px 둥근 모서리 |
| 그림자 | `shadow-lg` | 부드럽게 퍼지는 그림자 |
| 반투명 | `backdrop-blur-md` | 배경 블러 효과 |
| 폰트 | `font-sans` (시스템 폰트 스택) | `-apple-system, BlinkMacSystemFont, 'Segoe UI'` |
| 터치 타깃 | `min-h-[44px] min-w-[44px]` | 모바일 최소 터치 영역 44px |

---

### 8. 테마 (라이트 / 다크)

| 항목 | 내용 |
|------|------|
| **선택** | Tailwind `dark:` 변형 + `localStorage('theme')` |
| **대안** | CSS 변수 수동 전환, 별도 테마 라이브러리 |
| **근거** | Tailwind의 `dark:` 변형은 `<html class="dark">` 토글 하나로 전체 다크 모드를 적용한다. `localStorage`에 저장해 새로고침 후에도 유지. 추가 라이브러리 없이 구현 가능하다. |
| **트레이드오프** | Tailwind CDN 환경에서 `darkMode: 'class'` 설정이 기본 포함되어 있지 않으면 별도 CDN URL 파라미터가 필요하다. |

**구현 규칙**

```javascript
// 초기값: localStorage 우선, 없으면 시스템 설정 따름
const saved = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = saved ? saved === 'dark' : prefersDark;
document.documentElement.classList.toggle('dark', isDark);

// 토글 시
function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}
```

---

## 의존성 추가 정책

> **이 문서에 사유를 기록하기 전까지 새 라이브러리·패키지를 도입할 수 없다.**

새 의존성이 필요하다고 판단되면 아래 절차를 따른다.

1. 이 문서 하단 "의존성 변경 이력" 테이블에 추가 사유를 먼저 작성한다.
2. 사용자 승인을 받는다.
3. 승인 후 설치하고 `02-specs.md`의 기술 스택 목록을 업데이트한다.

### 의존성 변경 이력

| 날짜 | 패키지 | 방향 | 사유 | 승인자 |
|------|--------|------|------|--------|
| — | — | — | 최초 작성 시 변경 이력 없음 | — |
