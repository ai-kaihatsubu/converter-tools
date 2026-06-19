# 005-unit-converter（単位変換ツール）

長さ・重さ・温度・面積・体積・速度・データ容量・時間をブラウザ内だけで変換するツールです。

## 機能

- カテゴリタブ切替（長さ・重さ・温度・面積・体積・速度・データ容量・時間）
- 値＋元の単位を入力すると、同カテゴリ内の全単位への換算結果を一覧表示
- 温度（℃/℉/K）は式変換、他は係数変換（データ容量は1024進）
- 大きい/小さい数値は指数表記、それ以外は有効桁数を考慮した表示
- 各結果にコピーボタン（Clipboard API、非対応時はフォールバック）
- 選択カテゴリ・単位・入力値をlocalStorageに保存し再訪時に復元
- ダーク/ライト切替、レスポンシブ、アクセシビリティ対応
- PWA対応（manifest + sw.js + Service Worker登録）

## プライバシー

- 入力データは外部送信・保存しません。すべて端末内（ブラウザ）で処理します。
- localStorageに保存するのはカテゴリ・単位・入力値・テーマ設定のみ。

## 収益設計（プレースホルダ）

- AdSense: コンテンツ上下に2枠（`monetization.js`の`ADSENSE_CLIENT_ID`未設定）
- アフィリエイト: 「おすすめ」枠（手帳・文房具・学習参考書想定、`AFFILIATE_ITEMS`未設定）
- Stripe お布施: 任意のご支援（`STRIPE_DONATION_URL`未設定）

## 公開手順（社長作業）

1. GitHub新規リポジトリ `unit-converter` を作成し、GitHub Pagesで公開
2. `index.html`等の`canonical`/OGP URLが実際の公開URLと一致するか確認
3. `operator.html`の運営者情報・特定商取引法に基づく表記を記入
4. AdSense審査申請 → 通過後 `monetization.js`の`ADSENSE_CLIENT_ID`設定とタグ有効化
5. AdSense配信開始に伴うCookie同意（CMP）対応の検討
6. アフィリエイト提携（手帳・文房具・学習参考書等）→ `AFFILIATE_ITEMS`を実リンクに更新
7. Stripeお布施Link発行 → `STRIPE_DONATION_URL`設定
8. 公開前に開発用「Proフラグを切替（開発用）」ボタンの削除を検討
