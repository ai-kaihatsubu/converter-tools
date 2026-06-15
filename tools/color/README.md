# カラーコード変換ツール（products/009-color-converter）

第9号製品。HEX・RGB・HSL・RGBA・HSLAを相互変換できるカラーコード変換ツールです。
完全クライアントサイド・サーバー不要・オフライン動作（PWA対応）。

## 主な機能

- HEX / RGB / HSL / RGBA / HSLA の相互変換（いずれかを入力すると他のすべてが自動同期）
- カラーピッカー（`input type="color"`）連動
- 大きな色プレビュー（透明度確認用の市松模様背景）
- 透明度（α）スライダーでRGBA・HSLAの透明度を調整
- 各表記のコピー機能（クリップボードAPI＋フォールバック）
- ランダム色生成
- よく使う色のサンプル（14色のスウォッチ）
- **WCAGコントラスト比チェック**: 前景色・背景色を指定し、コントラスト比を計算。
  AA（通常文字4.5:1以上 / 大きな文字3:1以上）、AAA（通常文字7:1以上 / 大きな文字4.5:1以上）の合否を表示
- ダーク/ライトテーマ切替
- アクセシビリティ対応（ラベル、aria属性、エラーメッセージのlive region、キーボード操作、コントラスト）
- レスポンシブ・モバイルファースト
- PWA対応（ホーム画面に追加・オフライン動作）

## プライバシー設計

- すべての変換・計算処理は端末内のみで行われ、**外部送信は一切行いません。**
- localStorageには「テーマ設定・Proフラグ」のみを保存します（キー: `tf_theme` / `tf_pro`）。

## 収益設計（現状はすべてプレースホルダ）

| レール | 実装箇所 | 状態 |
| --- | --- | --- |
| AdSense | `index.html` の `.ad-slot--top` / `.ad-slot--bottom`、`monetization.js` の `ADSENSE_CLIENT_ID` | プレースホルダ。Pro時は非表示 |
| アフィリエイト | `monetization.js` の `AFFILIATE_ITEMS`（デザイン関連商材） | プレースホルダURL、[PR]表記・`rel="sponsored nofollow noopener"`設定済み |
| Stripe (Pro ¥480買い切り) | `monetization.js` の `STRIPE_PAYMENT_LINK_URL`、`#pro-button` | 未設定時は「準備中」アラート表示 |

Pro動作確認用に、画面下部の「Proフラグを切替（開発用）」ボタンでlocalStorageの
`tf_pro`フラグを切り替えられます（広告非表示の挙動を確認できます）。

## 公開手順（社長がやるキー登録一覧）

1. Googleアドセンスの審査申請・通過後、`monetization.js`の`ADSENSE_CLIENT_ID`と
   `index.html`内のコメントアウトされたAdSenseスクリプト・`<ins>`タグを有効化する
2. アフィリエイト提携（デザインツール・配色参考書等）の承認後、`monetization.js`の
   `AFFILIATE_ITEMS`を実際のリンクに置き換える
3. Stripeで「カラーコード変換ツール Pro ¥480」のPayment Linkを発行し、
   `monetization.js`の`STRIPE_PAYMENT_LINK_URL`に設定する
4. `operator.html`の運営者情報・特定商取引法に基づく表記のTODOを埋める
5. 公開先リポジトリ（color-converter）でGitHub Pagesを設定し、`canonical`/OGPのURL
   （`https://ai-kaihatsubu.github.io/color-converter/`）が実URLと一致していることを確認する
6. 開発用「Proフラグを切替」ボタンは公開前に削除またはコメントアウトを検討する
7. リーガル/リスクチェック（`approval-queue/pending/009-color-converter/`）と社長承認を経て公開する

## ファイル構成

- `index.html` … ページ本体（SEO・ツールUI・コントラスト比チェック・広告枠・アフィリ枠・Pro案内・使い方/FAQ）
- `style.css` … 共通スタイル＋本ツール固有のコンポーネント
- `app.js` … 色変換ロジック（HEX/RGB/HSL相互変換、コントラスト比計算）・テーマ切替
- `monetization.js` … 収益3レールの設定・レンダリング
- `manifest.webmanifest` / `sw.js` / `icons/` … PWA関連
- `privacy.html` / `terms.html` / `operator.html` … 法務ページ
