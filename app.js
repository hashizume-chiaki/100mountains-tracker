// ─── State ──────────────────────────────────────────────────────────────────
let progress = {};      // { [id]: { climbed: bool, date: string|null } }
let currentSha = null;  // SHA of progress.json on GitHub
let sortState = { col: 'id', dir: 'asc' };
let filterText = '';
let filterUnclimbed = false;
let saveTimer = null;
let isSaving = false;

// ─── GitHub API ──────────────────────────────────────────────────────────────
const GH_API = 'https://api.github.com';

function ghConfig() {
  return {
    pat:   localStorage.getItem('gh_pat')   || '',
    owner: localStorage.getItem('gh_owner') || '',
    repo:  localStorage.getItem('gh_repo')  || '',
    path:  'data/progress.json',
  };
}

function ghHeaders(cfg) {
  return {
    'Authorization': `Bearer ${cfg.pat}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

async function fetchProgress() {
  const cfg = ghConfig();
  if (!cfg.pat || !cfg.owner || !cfg.repo) return false;

  const url = `${GH_API}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  try {
    const res = await fetch(url, { headers: ghHeaders(cfg) });
    if (res.status === 404) {
      currentSha = null;
      return true; // file doesn't exist yet — that's fine
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    currentSha = data.sha;
    const json = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, '')))));
    progress = json.entries || {};
    return true;
  } catch (e) {
    console.error('fetchProgress error:', e);
    return false;
  }
}

async function saveProgress() {
  const cfg = ghConfig();
  if (!cfg.pat || !cfg.owner || !cfg.repo) return;
  if (isSaving) { scheduleAutoSave(200); return; }

  isSaving = true;
  showBanner('同期中...', '');

  const payload = {
    version: 1,
    lastUpdated: new Date().toISOString(),
    entries: progress,
  };
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
  const body = {
    message: 'chore: update climbing progress [skip ci]',
    content,
    ...(currentSha ? { sha: currentSha } : {}),
  };

  const url = `${GH_API}/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  try {
    const res = await fetch(url, { method: 'PUT', headers: ghHeaders(cfg), body: JSON.stringify(body) });

    if (res.status === 409) {
      // Conflict — re-fetch and retry
      await fetchProgress();
      isSaving = false;
      scheduleAutoSave(100);
      return;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    const result = await res.json();
    currentSha = result.content.sha;
    showBanner('同期完了 ✓', 'success');
    setTimeout(() => hideBanner(), 2500);
  } catch (e) {
    console.error('saveProgress error:', e);
    showBanner(`同期失敗: ${e.message}`, 'error');
  } finally {
    isSaving = false;
  }
}

function scheduleAutoSave(delay = 800) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveProgress, delay);
}

// ─── Settings ────────────────────────────────────────────────────────────────
async function testConnection() {
  const cfg = ghConfig();
  if (!cfg.pat || !cfg.owner || !cfg.repo) return false;

  const url = `${GH_API}/repos/${cfg.owner}/${cfg.repo}`;
  try {
    const res = await fetch(url, { headers: ghHeaders(cfg) });
    return res.ok;
  } catch { return false; }
}

document.getElementById('save-settings-btn').addEventListener('click', async () => {
  const owner = document.getElementById('owner-input').value.trim();
  const repo  = document.getElementById('repo-input').value.trim();
  const pat   = document.getElementById('pat-input').value.trim();
  const status = document.getElementById('settings-status');

  if (!owner || !repo || !pat) {
    setStatus(status, '全てのフィールドを入力してください', 'err');
    return;
  }

  localStorage.setItem('gh_owner', owner);
  localStorage.setItem('gh_repo', repo);
  localStorage.setItem('gh_pat', pat);

  setStatus(status, '接続テスト中...', '');
  document.getElementById('save-settings-btn').disabled = true;

  const ok = await testConnection();
  document.getElementById('save-settings-btn').disabled = false;

  if (ok) {
    setStatus(status, '接続成功 ✓ データを読み込んでいます...', 'ok');
    document.getElementById('sync-now-btn').disabled = false;
    const fetched = await fetchProgress();
    if (fetched) {
      setStatus(status, '接続成功 ✓ データを読み込みました', 'ok');
      renderTable();
      updateProgressBar();
    } else {
      setStatus(status, '接続成功 ✓（データファイルはまだありません）', 'ok');
    }
  } else {
    setStatus(status, '接続失敗 — ユーザー名・リポジトリ名・Tokenを確認してください', 'err');
    document.getElementById('sync-now-btn').disabled = true;
  }
});

document.getElementById('sync-now-btn').addEventListener('click', async () => {
  const ok = await fetchProgress();
  if (ok) { renderTable(); updateProgressBar(); showBanner('同期完了 ✓', 'success'); setTimeout(hideBanner, 2500); }
  else showBanner('同期失敗', 'error');
});

document.getElementById('settings-btn').addEventListener('click', () => {
  const panel = document.getElementById('settings-panel');
  panel.classList.toggle('visible');
  panel.classList.remove('hidden');
});

document.getElementById('close-settings-btn').addEventListener('click', () => {
  document.getElementById('settings-panel').classList.remove('visible');
});

// ─── Sort ────────────────────────────────────────────────────────────────────
const COMPARATORS = {
  id:         (a, b) => a.id - b.id,
  name:       (a, b) => a.name.localeCompare(b.name, 'ja'),
  elevation:  (a, b) => a.elevation - b.elevation,
  prefecture: (a, b) => a.prefecture.localeCompare(b.prefecture, 'ja'),
  difficulty: (a, b) => a.difficulty.localeCompare(b.difficulty),
  climbed:    (a, b) => climbedNum(a) - climbedNum(b),
  date:       (a, b) => (progress[a.id]?.date || '').localeCompare(progress[b.id]?.date || ''),
};

function climbedNum(m) { return progress[m.id]?.climbed ? 1 : 0; }

document.querySelectorAll('th[data-col]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col;
    if (sortState.col === col) {
      sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.col = col;
      sortState.dir = 'asc';
    }
    renderTable();
  });
});

function getSortedFiltered() {
  const q = filterText.toLowerCase();
  return MOUNTAINS
    .filter(m => {
      if (filterUnclimbed && progress[m.id]?.climbed) return false;
      if (q && !m.name.includes(q) && !m.prefecture.includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      const cmp = COMPARATORS[sortState.col](a, b);
      return sortState.dir === 'asc' ? cmp : -cmp;
    });
}

function updateSortHeaders() {
  document.querySelectorAll('th[data-col]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === sortState.col) {
      th.classList.add(`sort-${sortState.dir}`);
    }
  });
}

// ─── Render ──────────────────────────────────────────────────────────────────
function renderTable() {
  updateSortHeaders();
  const tbody = document.getElementById('table-body');
  const data = getSortedFiltered();

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div id="empty-state">該当する山がありません</div></td></tr>`;
    return;
  }

  const frag = document.createDocumentFragment();
  for (const m of data) {
    const p = progress[m.id] || {};
    const climbed = !!p.climbed;
    const date = p.date || '';

    const tr = document.createElement('tr');
    if (climbed) tr.className = 'climbed';

    tr.innerHTML = `
      <td class="td-id td-center">${m.id}</td>
      <td class="td-name">${escHtml(m.name)}</td>
      <td class="td-elev">${m.elevation.toLocaleString('ja-JP')}</td>
      <td>${escHtml(m.prefecture)}</td>
      <td class="td-center"><span class="badge diff-${m.difficulty}">${m.difficulty}</span></td>
      <td class="td-center">
        <input type="checkbox" class="climbed-check" data-id="${m.id}" ${climbed ? 'checked' : ''} aria-label="${escHtml(m.name)} 登頂">
      </td>
      <td>
        <input type="date" class="date-input" data-id="${m.id}" value="${escHtml(date)}" ${!climbed ? 'disabled' : ''} aria-label="${escHtml(m.name)} 登頂日">
      </td>
    `;
    frag.appendChild(tr);
  }
  tbody.innerHTML = '';
  tbody.appendChild(frag);
}

function updateProgressBar() {
  const total = MOUNTAINS.length;
  const done  = MOUNTAINS.filter(m => progress[m.id]?.climbed).length;
  const pct   = total > 0 ? (done / total * 100).toFixed(1) : 0;
  document.getElementById('progress-text').textContent = `登頂済み: ${done} / ${total}`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

// ─── Table interaction (event delegation) ───────────────────────────────────
document.getElementById('table-body').addEventListener('change', e => {
  const el = e.target;
  const id = Number(el.dataset.id);
  if (!id) return;

  if (!progress[id]) progress[id] = {};

  if (el.type === 'checkbox') {
    progress[id].climbed = el.checked;
    if (!el.checked) progress[id].date = null;
    renderTable();
    updateProgressBar();
    scheduleAutoSave();
  } else if (el.type === 'date') {
    progress[id].date = el.value || null;
    scheduleAutoSave();
  }
});

// ─── Filter / Search ─────────────────────────────────────────────────────────
document.getElementById('search-input').addEventListener('input', e => {
  filterText = e.target.value.trim();
  renderTable();
});

document.getElementById('filter-unclimbed').addEventListener('change', e => {
  filterUnclimbed = e.target.checked;
  renderTable();
});

// ─── Banner helpers ──────────────────────────────────────────────────────────
function showBanner(msg, type) {
  const b = document.getElementById('sync-banner');
  b.textContent = msg;
  b.className = type || '';
  b.classList.remove('hidden');
}
function hideBanner() {
  document.getElementById('sync-banner').classList.add('hidden');
}

function setStatus(el, msg, cls) {
  el.textContent = msg;
  el.className = cls;
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Init ────────────────────────────────────────────────────────────────────
async function init() {
  // Populate settings fields from localStorage
  const owner = localStorage.getItem('gh_owner') || '';
  const repo  = localStorage.getItem('gh_repo')  || '';
  const pat   = localStorage.getItem('gh_pat')   || '';
  document.getElementById('owner-input').value = owner;
  document.getElementById('repo-input').value  = repo;
  // Don't pre-fill PAT input for security, but indicate it's set
  if (pat) document.getElementById('pat-input').placeholder = '（設定済み）';

  if (owner && repo && pat) {
    document.getElementById('sync-now-btn').disabled = false;
    showBanner('GitHubからデータを読み込み中...', '');
    const ok = await fetchProgress();
    if (ok) {
      hideBanner();
    } else {
      showBanner('GitHub同期に失敗しました — 設定を確認してください', 'error');
    }
  } else {
    // No settings yet — show prompt
    showBanner('⚙ 右上の設定ボタンからGitHub同期を設定すると、データが保存・同期されます', '');
  }

  renderTable();
  updateProgressBar();
}

init();
