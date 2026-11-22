# 公開用コピー(publicProgress)設計メモ

日付: 2026-11-22

## 目的

Claude などの外部ツールが、ログインなしで最新の登頂状況を読めるようにする。
本体の記録 `users/{uid}` は本人しか読めないため、登頂済みの山だけを
読み取り専用の公開ドキュメントに書き出す。

## 仕組み

- 保存先: Firestore `publicProgress/{uid}`
- 書き込むタイミング
  - チェック・日付の変更を保存するとき(`saveProgress`。本体の保存が成功した後)
  - ログインして記録を読み込んだとき(初回作成と、他の端末の変更との同期を兼ねる)。
    移行データの読み込みに失敗して空のときは、空で上書きしないよう書かない
- 公開用コピーの保存だけ失敗した場合は、本体は保存済みであることと失敗をバナーで知らせる
- 画面: ログイン中は検索欄の右に「公開URLをコピー」ボタンを表示する

## 中身

```json
{
  "version": 1,
  "updatedAt": "<serverTimestamp>",
  "total": 100,
  "climbedCount": 37,
  "climbed": [{ "id": 30, "name": "谷川岳", "date": null }],
  "climbedText": "30 谷川岳\n45 白馬岳 (2025-08-04)",
  "unclimbedText": "1 利尻山\n2 羅臼岳"
}
```

`climbedText` / `unclimbedText` は、REST API の型付き JSON を読まなくても
内容が分かるように入れている。

## 読み方

```
GET https://firestore.googleapis.com/v1/projects/hyakumeizan-tracker/databases/(default)/documents/publicProgress/{uid}
```

## セキュリティルール

`firestore.rules` を参照。URL を知っていれば誰でも1件ずつ読める(get)が、
一覧(list)は不可。書き込みは本人だけで、フィールドは上の7つに限る。
フィールドを増やすときはルールも更新する。
