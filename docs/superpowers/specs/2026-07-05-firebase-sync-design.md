# Firebase同期版 100mountains-tracker 設計書

日付: 2026-07-05
ステータス: 承認済み

## 背景と目的

現在の進捗データ同期は GitHub Contents API + Personal Access Token (PAT) で
リポジトリ内の `data/progress.json` を直接読み書きする方式。デバイスごとに
PAT の設定が必要で、複数デバイス(スマホ・PC)での利用が面倒。

これを **Firebase (Authentication + Cloud Firestore)** に置き換え、
「Googleでログイン」を押すだけでどのデバイスでも同じデータに接続できるようにする。

## 全体構成

- **ホスティング**: 変更なし。GitHub Pages (`hashizume-chiaki.github.io/100mountains-tracker`)
- **認証**: Firebase Authentication の Googleログイン
  - ヘッダーの「⚙設定」ボタンを「Googleでログイン」ボタンに置き換える
  - ログイン後はアカウントのアイコン(または名前)と「ログアウト」を表示
- **データ保存**: Cloud Firestore。ユーザーごとに1ドキュメント `users/{uid}`
- **SDK**: Firebase JS SDK を CDN (ESM import) で読み込み。ビルド工程は導入しない
- **Firebase設定オブジェクト**: `app.js` に直接埋め込む(公開情報。保護は
  セキュリティルールと承認済みドメインで行う)

## データ構造

Firestore `users/{uid}` ドキュメント:

```json
{
  "version": 2,
  "lastUpdated": "<serverTimestamp>",
  "entries": {
    "18": { "climbed": true, "date": null },
    "45": { "climbed": true, "date": "2025-08-04" }
  }
}
```

- 現行 `progress.json` の `entries` 形式をそのまま踏襲(移行が単純になる)
- 100座分でも数KBのため1ドキュメントで十分
- 書き込みは「変更のたびにドキュメント丸ごと `setDoc`」。現行の
  デバウンス(800ms)の仕組みを流用する

### セキュリティルール

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

自分の uid のドキュメントのみ読み書き可。

## 同期の動き

- **リアルタイム反映**: `onSnapshot` リスナーで自分のドキュメントを購読。
  他デバイスでの変更が数秒で画面に反映される
- **オフライン対応**: `persistentLocalCache` を有効化。圏外で記録した変更は
  ローカルに保持され、復帰時に自動送信される
- **競合解決**: last-write-wins(単一ユーザーのため実用上問題なし)
- **自分の書き込みのエコー**: onSnapshot で自分の書き込みが返ってきた際に
  画面がちらつかないよう、`hasPendingWrites` やローカル状態との差分を考慮する

## 既存データの移行

1. 初回ログイン時、Firestore に `users/{uid}` が存在しなければ、
   同一オリジンの `data/progress.json`(28座分)を fetch して初期データとして保存
2. 以降 `progress.json` への書き込みは行わない(ファイル自体は移行ソースとして残す)

## 削除するもの

- GitHub API 関連コード一式(`fetchProgress` / `saveProgress` の GitHub 実装、
  `ghConfig` / `ghHeaders` / `testConnection`)
- 設定パネル(owner / repo / PAT 入力欄)と関連 UI・イベントハンドラ
- localStorage の `gh_pat` / `gh_owner` / `gh_repo`(初回起動時にクリーンアップ)

## 変更するファイル

| ファイル | 変更内容 |
|---|---|
| `app.js` | GitHub API層 → Firebase層に置き換え。認証状態管理を追加 |
| `index.html` | 設定パネル削除、ログインボタン/アカウント表示を追加、SDK読み込み |
| `style.css` | ログインボタン・アカウント表示のスタイル追加、設定パネルのスタイル削除 |

## UI状態

| 状態 | 表示 |
|---|---|
| 未ログイン | バナー「Googleでログインすると記録が保存・同期されます」+ ログインボタン。表は閲覧可(チェックは促しのみ) |
| ログイン中(初回) | progress.json からインポート → 「データを移行しました」 |
| ログイン済み | アカウント表示+ログアウト。チェック操作 → デバウンス保存 → 「同期完了 ✓」バナー(現行踏襲) |
| オフライン | 操作は可能。「オフライン — 復帰時に自動同期します」表示 |
| 同期エラー | 「同期失敗: <理由>」バナー(現行踏襲) |

## エラー処理

- ログインポップアップがブロック/失敗 → `signInWithRedirect` にフォールバック
- Firestore 書き込み失敗 → エラーバナー表示、デバウンスで自動リトライ
- 移行時に progress.json の fetch 失敗 → 空データで開始し、警告バナー表示

## 事前に必要な Firebase コンソール設定(ユーザー作業・ガイド付き)

1. Firebase プロジェクト作成(無料 Spark プラン)
2. Authentication で Google プロバイダを有効化
3. 承認済みドメインに `hashizume-chiaki.github.io` を追加(localhost はデフォルトで承認済み)
4. Cloud Firestore を作成し、上記セキュリティルールを設定

## 動作確認

1. ローカル(`python3 -m http.server` 等)でログイン → チェック → リロードして保持を確認
2. 別ブラウザ(またはシークレットウィンドウ)で同じアカウントでログイン → リアルタイム反映を確認
3. 初回移行: Firestore 側のデータを消した状態でログイン → 28座分がインポートされることを確認
4. GitHub Pages にデプロイして本番ドメインでログイン確認

## スコープ外

- 複数ユーザーでの共有・公開プロフィール
- 登山メモ・写真などの新機能
- PWA のオフラインキャッシュ強化(既存 manifest のまま)
