# EXIF Framer

写真にポラロイド風の EXIF フレームを追加する Web アプリ。画像はすべてブラウザ内で処理され、サーバーにアップロードされません。

## 機能

- ドラッグ＆ドロップまたはクリックで写真を選択（複数枚バッチ対応）
- EXIF からカメラ・撮影設定を自動読み取り・編集
- テンプレート（Shot on / ミニマル / フィルム）、色・枠・角丸・影
- 署名・透かし、文字サイズ・配置
- PNG / JPEG ダウンロード、複数枚は ZIP
- 設定と言語をブラウザに記憶
- PWA（ホーム画面追加・初回読み込み後はオフラインでも利用可）
- 日本語 / 英語 UI 切り替え

## ローカル開発

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いてください。

## ビルド

```bash
npm run build
npm start
```

## Vercel へのデプロイ

1. このリポジトリを GitHub に push
2. [vercel.com](https://vercel.com) にログイン
3. **Add New → Project** からリポジトリをインポート
4. Framework Preset が **Next.js** と自動検出されることを確認
5. **Deploy** をクリック

環境変数や追加設定は不要です。

## 技術スタック

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- [exifr](https://github.com/MikeKovarik/exifr) — EXIF 解析
- Canvas API — フレーム合成

> `public/exifr.full.umd.js` は `exifr@7.1.3` の UMD ビルドを同梱したものです。exifr を更新する際は `node_modules/exifr/dist/full.umd.js` をコピーしてください。

## ライセンス

MIT
