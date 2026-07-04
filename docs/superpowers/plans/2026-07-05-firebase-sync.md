# Firebase同期 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub PAT方式のデータ同期を Firebase (Google認証 + Firestore) に置き換え、どのデバイスでもGoogleログインだけで登頂記録が同期されるようにする。

**Architecture:** アプリは `index.html` 単一ファイル(CSS/JS/山データすべてインライン)。この構成を維持し、インラインJSのGitHub API層をFirebase層に置き換える。Firebase JS SDK はCDNからESM importする(ビルド工程なし)。データはFirestoreの `users/{uid}` 1ドキュメント。リポジトリ内の `app.js` / `style.css` / `data/mountains.js` は index.html から参照されていない古い残骸なので削除する。

**Tech Stack:** Vanilla JS / Firebase JS SDK 12.x (CDN ESM) / Firebase Authentication (Google) / Cloud Firestore / GitHub Pages

**テスト方針:** このプロジェクトにはテスト基盤がなく、変更はFirebase統合とDOM操作が中心。自動テスト基盤の導入はYAGNIとし、各タスクにローカルサーバー+ブラウザでの具体的な手動検証ステップを置く。

**設計書:** `docs/superpowers/specs/2026-07-05-firebase-sync-design.md`

---

### Task 1: Firebaseプロジェクトのセットアップ(ユーザー作業・ガイド付き)

コード変更なし。Firebaseコンソールでの設定を行い、`firebaseConfig` の値を入手する。ユーザーと一緒に進める(Chrome操作の補助可)。

- [ ] **Step 1: Firebaseプロジェクト作成**

https://console.firebase.google.com/ を開き「プロジェクトを追加」。
プロジェクト名: `hyakumeizan-tracker`(任意)。Google Analyticsは**無効**でよい。

- [ ] **Step 2: Webアプリを登録して firebaseConfig を取得**

プロジェクト概要 → 「アプリを追加」→ Web (`</>`)。
アプリ名: `100mountains-tracker`。Firebase Hostingは**設定しない**。
表示される以下の形のオブジェクトを控える(Task 4 で使用):

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "<project-id>.firebaseapp.com",
  projectId: "<project-id>",
  storageBucket: "<project-id>.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

- [ ] **Step 3: Google認証を有効化**

構築 → Authentication → 「始める」→ Sign-in method → Google → 有効化。
サポートメール: nosce.te.ipsum1985@gmail.com を選択して保存。

- [ ] **Step 4: 承認済みドメインを追加**

Authentication → Settings → 承認済みドメイン → 「ドメインを追加」→ `hashizume-chiaki.github.io`。
(`localhost` はデフォルトで承認済みなので追加不要)

- [ ] **Step 5: Firestoreを作成**

構築 → Firestore Database → 「データベースを作成」。
ロケーション: `asia-northeast1` (東京)。**本番環境モード**で開始。

- [ ] **Step 6: セキュリティルールを設定**

Firestore Database → ルール タブで以下に置き換えて「公開」:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

- [ ] **Step 7: 確認**

firebaseConfig の6項目すべての値が控えられていること、Authentication に Google が「有効」と表示されること、Firestore のルールが公開済みであることを確認。

---

### Task 2: 残骸ファイルの削除

**Files:**
- Delete: `app.js`
- Delete: `style.css`
- Delete: `data/mountains.js`

`index.html` はこれらを一切参照していない(CSS/JS/山データすべてインライン)。誤編集の温床になるため削除する。`data/progress.json` は移行ソースなので**残す**。

- [ ] **Step 1: 参照されていないことを確認**

Run: `grep -n 'app\.js\|style\.css\|mountains\.js' index.html`
Expected: 何もヒットしない(exit code 1)

- [ ] **Step 2: 削除してコミット**

```bash
git rm app.js style.css data/mountains.js
git commit -m "chore: index.htmlから参照されていない残骸ファイルを削除"
```

- [ ] **Step 3: ローカルで表示確認**

Run: `python3 -m http.server 8000`(リポジトリルートで)
ブラウザで http://localhost:8000 を開き、表が100座表示され、検索・ソート・アコーディオン展開が動くことを確認。

---

### Task 3: GitHub同期コードと設定パネルの削除

**Files:**
- Modify: `index.html`

GitHub API層・設定パネル(HTML/CSS/JS)を削除し、ヘッダーの⚙ボタンをログインUIプレースホルダに置き換える。このタスク完了時点では「閲覧のみ動く」状態(保存機能なし)。

- [ ] **Step 1: 設定パネルのHTMLを削除**

`index.html` から `<div id="settings-panel" class="hidden">` ～ その閉じ `</div>`(「GitHub 同期設定」パネル全体、約20行)を削除。

- [ ] **Step 2: ヘッダーのボタンを置き換え**

```html
<button id="settings-btn" class="icon-btn" title="同期設定">⚙</button>
```
を以下に置き換え:

```html
<div id="auth-area">
  <img id="auth-avatar" class="hidden" alt="" referrerpolicy="no-referrer">
  <button id="auth-btn" class="auth-btn">ログイン</button>
</div>
```

- [ ] **Step 3: 設定パネルのCSSを削除し、ログインUIのCSSを追加**

`<style>` 内から `#settings-panel` ～ `#settings-status.err` のブロック(設定パネル関連一式)と、モバイル用 `.settings-inner` / `.settings-actions` の行を削除。

`.icon-btn` のブロックの直後に追加:

```css
#auth-area { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
#auth-avatar { width: 30px; height: 30px; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); }
#auth-avatar.hidden { display: none; }
.auth-btn {
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.3);
  color: #fff; border-radius: 6px; padding: 7px 12px;
  font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.auth-btn:hover { background: rgba(255,255,255,.25); }
```

- [ ] **Step 4: GitHub API関連のJSを削除**

インライン `<script>` から以下を削除:

- `let currentSha = null;` と `let isSaving = false;`(State宣言)
- `// ─── GitHub API ───` セクション全体: `GH_API` / `ghConfig()` / `ghHeaders()` / `fetchProgress()` / `saveProgress()`
- `// ─── Settings ───` セクション全体: `testConnection()` と `save-settings-btn` / `sync-now-btn` / `settings-btn` / `close-settings-btn` の4つのイベントリスナー
- `setStatus()` ヘルパー
- `init()` の中身を次のとおり置き換え:

```js
function init() {
  renderTable();
  updateProgressBar();
}
```

`scheduleAutoSave()` は**残す**(Task 5で新しい `saveProgress` に接続される)。呼び先の `saveProgress` が未定義になるため、暫定で次を置く:

```js
async function saveProgress() {} // Task 5でFirestore実装に置き換える
```

- [ ] **Step 5: 表示確認**

Run: `python3 -m http.server 8000`
http://localhost:8000 で: 表が表示される / ヘッダー右に「ログイン」ボタンが見える / チェックを入れてもエラーがコンソールに出ない(保存はされない)ことを確認。

- [ ] **Step 6: コミット**

```bash
git add index.html
git commit -m "refactor: GitHub PAT同期と設定パネルを削除、ログインUIの土台を追加"
```

---

### Task 4: Firebase初期化とGoogle認証

**Files:**
- Modify: `index.html`

- [ ] **Step 1: scriptタグをモジュール化しSDKをimport**

`<script>` を `<script type="module">` に変更し、先頭(MOUNTAINSの前)に追加。`firebaseConfig` の値はTask 1で取得したものを埋める:

```js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  onAuthStateChanged, signOut
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache,
  doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "<Task 1で取得した値>",
  authDomain: "<Task 1で取得した値>",
  projectId: "<Task 1で取得した値>",
  storageBucket: "<Task 1で取得した値>",
  messagingSenderId: "<Task 1で取得した値>",
  appId: "<Task 1で取得した値>"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = initializeFirestore(fbApp, { localCache: persistentLocalCache() });
```

- [ ] **Step 2: 認証状態の管理を追加**

State宣言部に追加:

```js
let user = null;          // Firebase User | null
let unsubscribe = null;   // Firestoreリスナー解除関数
```

Helpersセクションに追加:

```js
function updateAuthUI() {
  const btn = document.getElementById('auth-btn');
  const avatar = document.getElementById('auth-avatar');
  if (user) {
    btn.textContent = 'ログアウト';
    if (user.photoURL) { avatar.src = user.photoURL; avatar.classList.remove('hidden'); }
  } else {
    btn.textContent = 'ログイン';
    avatar.classList.add('hidden');
    avatar.removeAttribute('src');
  }
}
```

- [ ] **Step 3: ログイン/ログアウトのハンドラを追加**

```js
document.getElementById('auth-btn').addEventListener('click', async () => {
  if (user) {
    if (confirm('ログアウトしますか?')) await signOut(auth);
    return;
  }
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' ||
        e.code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);  // ポップアップ不可の環境向けフォールバック
    } else if (e.code !== 'auth/popup-closed-by-user' &&
               e.code !== 'auth/cancelled-popup-request') {
      showBanner(`ログイン失敗: ${e.message}`, 'error');
    }
  }
});
```

- [ ] **Step 4: onAuthStateChanged を追加**

`init()` を削除し、末尾の `init();` 呼び出しを以下に置き換え(データ購読はTask 5で拡張):

```js
onAuthStateChanged(auth, (u) => {
  user = u;
  updateAuthUI();
  if (!u) {
    progress = {};
    renderTable();
    updateProgressBar();
    showBanner('Googleでログインすると記録が保存・同期されます', '');
  }
});

renderTable();
updateProgressBar();
```

- [ ] **Step 5: 動作確認**

Run: `python3 -m http.server 8000`
http://localhost:8000 で:
1. 「ログイン」クリック → Googleのポップアップ → ログイン完了でボタンが「ログアウト」になりアバターが表示される
2. リロードしてもログイン状態が維持される
3. 「ログアウト」→ confirm → ボタンが「ログイン」に戻り、バナーが表示される
4. コンソールにエラーがないこと

- [ ] **Step 6: コミット**

```bash
git add index.html
git commit -m "feat: FirebaseのGoogle認証を追加"
```

---

### Task 5: Firestore同期(読み込み・リアルタイム・保存)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 購読処理を追加**

Helpersセクションに追加:

```js
function subscribeProgress(uid) {
  unsubscribe = onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.metadata.hasPendingWrites) return; // 自分の書き込みのエコーは無視(ちらつき防止)
    if (!snap.exists()) return;
    progress = snap.data().entries || {};
    renderTable();
    updateProgressBar();
  }, (e) => {
    console.error('subscribeProgress:', e);
    showBanner(`同期エラー: ${e.message}`, 'error');
  });
}
```

- [ ] **Step 2: saveProgress をFirestore実装に置き換え**

Task 3で置いた暫定 `async function saveProgress() {}` を置き換え:

```js
async function saveProgress() {
  if (!user) return;
  const payload = {
    version: 2,
    lastUpdated: serverTimestamp(),
    entries: progress,
  };
  if (!navigator.onLine) {
    // オフライン時: ローカルキャッシュに書き、復帰時にSDKが自動送信する
    setDoc(doc(db, 'users', user.uid), payload);
    showBanner('オフライン — 復帰時に自動同期します', '');
    return;
  }
  try {
    showBanner('同期中...', '');
    await setDoc(doc(db, 'users', user.uid), payload);
    showBanner('同期完了 ✓', 'success');
    setTimeout(hideBanner, 2500);
  } catch (e) {
    console.error('saveProgress:', e);
    showBanner(`同期失敗: ${e.message}`, 'error');
  }
}
```

- [ ] **Step 3: onAuthStateChanged にデータ読み込みを接続**

Task 4 Step 4 のコールバックを以下に置き換え:

```js
onAuthStateChanged(auth, async (u) => {
  user = u;
  updateAuthUI();
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  clearTimeout(saveTimer);
  if (u) {
    showBanner('データを読み込み中...', '');
    try {
      await ensureUserDoc(u.uid);   // Task 6で実装(このタスクでは下の暫定版)
      hideBanner();
    } catch (e) {
      console.error('ensureUserDoc:', e);
      showBanner(`読み込み失敗: ${e.message}`, 'error');
    }
    subscribeProgress(u.uid);
  } else {
    progress = {};
    renderTable();
    updateProgressBar();
    showBanner('Googleでログインすると記録が保存・同期されます', '');
  }
});
```

暫定版 `ensureUserDoc`(Task 6で移行処理入りに置き換え)をHelpersに追加:

```js
async function ensureUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    progress = snap.data().entries || {};
    renderTable();
    updateProgressBar();
  }
}
```

- [ ] **Step 4: 未ログイン時のチェック操作をガード**

`table-body` の `change` リスナーの先頭(`const el = e.target;` の前)に追加:

```js
if (!user) {
  showBanner('記録するにはログインしてください', 'error');
  setTimeout(hideBanner, 2500);
  renderTable(); // チェック状態を元に戻す
  return;
}
```

- [ ] **Step 5: 動作確認**

http://localhost:8000 で:
1. 未ログインでチェック → 「記録するにはログインしてください」が出てチェックが戻る
2. ログイン → チェックを数個入れる → 「同期完了 ✓」
3. リロード → チェックが保持されている
4. 別ブラウザ(またはシークレット)で同じアカウントでログイン → 同じチェック状態が出る → 片方でチェック変更 → もう片方に数秒で反映される
5. Firebaseコンソール → Firestore で `users/{uid}` ドキュメントに `entries` が入っていることを確認

- [ ] **Step 6: コミット**

```bash
git add index.html
git commit -m "feat: Firestoreによる保存とリアルタイム同期を追加"
```

---

### Task 6: 既存データの移行と後片付け

**Files:**
- Modify: `index.html`

- [ ] **Step 1: ensureUserDoc を移行処理入りに置き換え**

Task 5 Step 3 の暫定版を置き換え:

```js
async function ensureUserDoc(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    progress = snap.data().entries || {};
    renderTable();
    updateProgressBar();
    return;
  }
  // 初回ログイン: 旧progress.jsonから移行
  let entries = {};
  let migrated = false;
  try {
    const res = await fetch('data/progress.json');
    if (res.ok) {
      entries = (await res.json()).entries || {};
      migrated = Object.keys(entries).length > 0;
    }
  } catch (e) {
    console.warn('移行データの読み込みに失敗(空データで開始):', e);
    showBanner('以前の記録の読み込みに失敗しました — 空の状態で開始します', 'error');
    setTimeout(hideBanner, 4000);
  }
  await setDoc(ref, { version: 2, lastUpdated: serverTimestamp(), entries });
  progress = entries;
  renderTable();
  updateProgressBar();
  if (migrated) {
    showBanner('既存の記録を移行しました ✓', 'success');
    setTimeout(hideBanner, 3000);
  }
}
```

- [ ] **Step 2: 旧localStorageキーのクリーンアップ**

スクリプト末尾(onAuthStateChangedの後)に追加:

```js
['gh_pat', 'gh_owner', 'gh_repo'].forEach(k => localStorage.removeItem(k));
```

- [ ] **Step 3: 移行の動作確認**

1. Firebaseコンソール → Firestore → 自分の `users/{uid}` ドキュメントを削除
2. http://localhost:8000 をリロード(ログイン済み) → 「既存の記録を移行しました ✓」→ 28座にチェックが入る(蔵王山・吾妻山・磐梯山・白馬岳(2025-08-04)など)
3. 進捗バーが「登頂済み: 28 / 100」になる
4. DevTools → Application → Local Storage で `gh_pat` / `gh_owner` / `gh_repo` が消えている

- [ ] **Step 4: コミット**

```bash
git add index.html
git commit -m "feat: 初回ログイン時にprogress.jsonから記録を移行"
```

---

### Task 7: 本番デプロイと最終確認

**Files:** なし(push のみ)

- [ ] **Step 1: ローカル最終チェック**

http://localhost:8000 で一通り: ログイン/ログアウト、チェック追加・解除、登頂日入力、検索、ソート、未登頂フィルタ、アコーディオン展開。コンソールにエラーがないこと。

- [ ] **Step 2: デプロイ**

```bash
git push origin main
```

GitHub Pagesの反映を待つ(1〜2分)。

- [ ] **Step 3: 本番確認**

https://hashizume-chiaki.github.io/100mountains-tracker/ で:
1. Googleログインが成功する(承認済みドメイン設定の確認になる)
2. ローカルで付けたチェックがそのまま表示される(同じFirestoreを見ているため)
3. スマホでも開いてログイン → 同じデータが見えること

- [ ] **Step 4: 完了確認**

スマホでチェック変更 → PCに反映されることを確認できたら完了。
