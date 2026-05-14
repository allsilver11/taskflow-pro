// ── 상수 ──────────────────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:8000/api/v1';
const POLL_INTERVAL_MS = 3000;

const STATUS_LABELS = {
  todo: '할 일',
  in_progress: '진행 중',
  done: '완료',
};

const STATUS_BADGE = {
  todo: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300',
};

// ── 상태 변수 ─────────────────────────────────────────────────────
let tasks = [];
let pollTimer = null;
let pendingDeleteId = null;

// ── 테마 ──────────────────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
  document.getElementById('theme-icon').textContent = isDark ? '☀️' : '🌙';
}

// ── 날짜 유틸 ─────────────────────────────────────────────────────
function formatDueLabel(dueAt) {
  if (!dueAt) return null;
  const due = new Date(dueAt);
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueMidnight = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueMidnight - todayMidnight) / 86400000);
  const hh = String(due.getHours()).padStart(2, '0');
  const mm = String(due.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  if (diffDays > 0) return { text: `D-${diffDays} ${timeStr}`, overdue: false };
  if (diffDays === 0) return { text: `D-DAY ${timeStr}`, overdue: false };
  return { text: `D+${Math.abs(diffDays)} ${timeStr}`, overdue: true };
}

function isoToLocalInput(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(localDt) {
  if (!localDt) return null;
  return new Date(localDt).toISOString();
}

// XSS 방지용 HTML 이스케이프
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── API ───────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  return res;
}

async function loadTasks() {
  try {
    const res = await apiFetch('/tasks');
    if (res && res.ok) {
      tasks = await res.json();
      renderTaskList();
      document.getElementById('error-state').classList.add('hidden');
    }
  } catch {
    // 서버 연결 실패 시 에러 상태 표시
    document.getElementById('task-list').innerHTML = '';
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
  }
}

async function createTask(data) {
  return apiFetch('/tasks', { method: 'POST', body: JSON.stringify(data) });
}

async function updateTask(id, data) {
  return apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

async function deleteTask(id) {
  return apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}

async function getTaskDetail(id) {
  const res = await apiFetch(`/tasks/${id}`);
  if (res && res.ok) return res.json();
  return null;
}

// ── 렌더 ──────────────────────────────────────────────────────────
function renderTaskList() {
  const listEl = document.getElementById('task-list');
  const emptyEl = document.getElementById('empty-state');

  if (tasks.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = tasks.map(renderTaskCard).join('');
}

function renderTaskCard(task) {
  const badge = STATUS_BADGE[task.status] || STATUS_BADGE.todo;
  const label = STATUS_LABELS[task.status] || task.status;
  const due = formatDueLabel(task.due_at);
  const dueHtml = due
    ? `<span class="text-xs font-mono ${due.overdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}">${due.text}</span>`
    : '';

  return `
    <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all active:scale-[0.99]"
         onclick="handleCardClick(event, ${task.id})">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0 space-y-1">
          <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium ${badge}">${label}</span>
          <p class="text-sm font-medium text-gray-900 dark:text-white break-words">${escHtml(task.title)}</p>
        </div>
        <button
          onclick="handleDeleteClick(event, ${task.id})"
          aria-label="삭제"
          class="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-colors flex-shrink-0 text-base">
          🗑
        </button>
      </div>
      ${due ? `<div class="mt-2 flex justify-end">${dueHtml}</div>` : ''}
    </div>
  `;
}

// ── 이벤트 핸들러 ─────────────────────────────────────────────────
function handleCardClick(e, taskId) {
  openEditModal(taskId);
}

function handleDeleteClick(e, taskId) {
  e.stopPropagation();
  pendingDeleteId = taskId;
  stopPolling();
  document.getElementById('delete-overlay').classList.remove('hidden');
}

// ── 추가 폼 ───────────────────────────────────────────────────────
async function handleAddSubmit(e) {
  e.preventDefault();
  const titleEl = document.getElementById('add-title');
  const title = titleEl.value.trim();
  const dueAt = document.getElementById('add-due-at').value;
  const status = document.getElementById('add-status').value;
  const errorEl = document.getElementById('add-title-error');

  errorEl.classList.add('hidden');

  if (!title) {
    errorEl.textContent = '업무 제목을 입력하세요.';
    errorEl.classList.remove('hidden');
    titleEl.focus();
    return;
  }

  const res = await createTask({ title, status, due_at: localInputToIso(dueAt) });

  if (res && res.ok) {
    document.getElementById('add-form').reset();
    await loadTasks();
  } else if (res) {
    const err = await res.json().catch(() => ({}));
    errorEl.textContent = err.message || '저장에 실패했습니다.';
    errorEl.classList.remove('hidden');
  }
}

// ── 수정 모달 ─────────────────────────────────────────────────────
async function openEditModal(taskId) {
  stopPolling();
  const task = await getTaskDetail(taskId);
  if (!task) return;

  document.getElementById('edit-title').value = task.title;
  document.getElementById('edit-description').value = task.description || '';
  document.getElementById('edit-due-at').value = isoToLocalInput(task.due_at);
  document.getElementById('edit-status').value = task.status;
  document.getElementById('edit-title-error').classList.add('hidden');
  document.getElementById('edit-form').dataset.taskId = task.id;
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('edit-title').focus();
}

function closeEditModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  startPolling();
}

async function handleEditSubmit(e) {
  e.preventDefault();
  const taskId = e.target.dataset.taskId;
  const titleEl = document.getElementById('edit-title');
  const title = titleEl.value.trim();
  const description = document.getElementById('edit-description').value.trim();
  const dueAt = document.getElementById('edit-due-at').value;
  const status = document.getElementById('edit-status').value;
  const errorEl = document.getElementById('edit-title-error');

  errorEl.classList.add('hidden');

  if (!title) {
    errorEl.textContent = '업무 제목을 입력하세요.';
    errorEl.classList.remove('hidden');
    titleEl.focus();
    return;
  }

  const res = await updateTask(taskId, {
    title,
    description: description || null,
    status,
    due_at: localInputToIso(dueAt),
  });

  if (res && res.ok) {
    closeEditModal();
    await loadTasks();
  } else if (res) {
    const err = await res.json().catch(() => ({}));
    errorEl.textContent = err.message || '저장에 실패했습니다.';
    errorEl.classList.remove('hidden');
  }
}

// ── 삭제 확인 ─────────────────────────────────────────────────────
async function confirmDelete() {
  if (pendingDeleteId === null) return;
  await deleteTask(pendingDeleteId);
  pendingDeleteId = null;
  document.getElementById('delete-overlay').classList.add('hidden');
  await loadTasks();
  startPolling();
}

function cancelDelete() {
  pendingDeleteId = null;
  document.getElementById('delete-overlay').classList.add('hidden');
  startPolling();
}

// ── 폴링 ──────────────────────────────────────────────────────────
function startPolling() {
  stopPolling();
  pollTimer = setInterval(loadTasks, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

// ── 초기화 ────────────────────────────────────────────────────────
function init() {
  initTheme();

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('add-form').addEventListener('submit', handleAddSubmit);
  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('modal-close').addEventListener('click', closeEditModal);
  document.getElementById('modal-cancel').addEventListener('click', closeEditModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeEditModal);
  document.getElementById('delete-confirm').addEventListener('click', confirmDelete);
  document.getElementById('delete-cancel').addEventListener('click', cancelDelete);

  loadTasks();
  startPolling();
}

init();
