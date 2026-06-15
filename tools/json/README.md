# 016-json-formatter（JSON整形・検証ツール）

JSONテキストを入力するだけで整形（インデント2/4選択）・圧縮（minify）・検証ができる無料ツールです。

## 機能

1. 整形: 入力したJSONを、選択したインデント幅（2または4）で見やすく複数行に整形します。
   「キーをアルファベット順にソート」をオンにすると、各オブジェクトのキーをソートして出力します。
2. 圧縮（minify）: 改行・空白を取り除いた1行のJSONに変換します。削減率も表示します。
3. 検証: JSONとして有効かどうかを判定し、不正な場合はエラー内容・位置（行・列・文字位置）・
   周辺テキスト・修正のヒントを表示します。
4. 結果はコピー可能です。

検算例: `{"b":2,"a":1}` を整形＋ソートすると `{"a": 1, "b": 2}`。不正なJSON（末尾カンマ等）は
エラー箇所を表示します。

## 実装

- `JSON.parse` / `JSON.stringify` を使用。`JSON.stringify`の`replacer`は使わず、
  ソートが必要な場合は事前にオブジェクトを再帰的にソートしてから渡す。
- エラー時は `SyntaxError.message` から位置情報（position / line / column）を抽出し、
  周辺テキストとともに表示。

## プライバシー

- 入力したJSONは外部送信・保存しません。すべて端末内（ブラウザ）で処理します。
- localStorageに保存するのはダーク/ライト表示設定のみ（入力JSONは含まない）。

## 収益設計（プレースホルダ）

- AdSense: コンテンツ上下に2枠（`monetization.js`の`ADSENSE_CLIENT_ID`に本番IDを設定済み。広告ローダーは1回だけ注入）
- アフィリエイト: 「おすすめ」枠（プログラミング学習サービス・API開発ツール等想定、`AFFILIATE_ITEMS`未設定）
- Stripe Pro（¥480買い切り）: 広告非表示・履行履歴の保存・差分比較を想定（`STRIPE_PAYMENT_LINK_URL`未設定）

## 公開手順（社長作業）

1. GitHub新規リポジトリ `json-formatter` を作成し、GitHub Pagesで公開
2. `index.html`等の`canonical`/OGP URLが実際の公開URLと一致するか確認
3. `operator.html`の運営者情報・特定商取引法に基づく表記を記入
4. AdSense審査申請（クライアントIDは設定済み）→ 通過後、広告配信を確認
5. AdSense配信開始に伴うCookie同意（CMP）対応の検討
6. アフィリエイト提携（プログラミング学習サービス等）→ `AFFILIATE_ITEMS`を実リンクに更新
7. Stripe Payment Link発行 → `STRIPE_PAYMENT_LINK_URL`設定
8. 公開前に開発用「Proフラグを切替（開発用）」ボタンの削除を検討
