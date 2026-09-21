# photo-to-3d

複数の角度から撮った写真を上げて、この Mac 上の **Object Capture（フォトグラメトリ）** で 3D（GLB）を作る Web アプリです。有料 API は使いません。

## 使い方

1. **撮る** — 被写体を一周。明るい場所、隣の写真と半分ほど重ねる。最低 8 枚、推奨 16 枚前後、最大 40 枚。JPG / PNG / WebP（iPhone の HEIC も可）。
2. **上げる** — `/login` のあと `/jobs/new` にドロップ。
3. **待つ** — Mac 上で数分かかることがあります。完了後に回転プレビューと GLB ダウンロード。履歴 `/jobs` から再開できます。

白い背景・単色で特徴の少ない被写体は失敗しやすいです。テクスチャのある小物を机の上で一周撮るのが向いています。

## セットアップ（ローカル・Mac）

Apple Silicon（このリポジトリは M シリーズで確認）と Xcode コマンドラインツール、Node.js 20+、[pnpm](https://pnpm.io/) 10。

```bash
cd photo-to-3d
pnpm install
cp .env.example .env.local
# RECONSTRUCTION_PROVIDER=local
pnpm dev
```

初回の復元時に `tools/object-capture` を `swift build` します。ブラウザは http://localhost:3000 。ログインの開発既定値は `dev-secret-change-me`。

```bash
pnpm build
APP_SECRET=... pnpm start
```

## 環境変数

| 名前 | 意味 |
| --- | --- |
| `APP_SECRET` | ログイン用共有シークレット |
| `RECONSTRUCTION_PROVIDER` | `local`（既定）/ `dummy`（立方体デモ）/ `tripo`（未配線） |
| `PHOTOGRAMMETRY_DETAIL` | `preview` / `reduced` / `medium`（既定）/ `full` / `raw` |
| `PHOTO_TO_3D_DATA_DIR` | SQLite・写真・GLB の保存先。既定 `./data` |

## データ

`data/`（gitignore 済）に残ります。

- `data/photo-to-3d.db`
- `data/uploads/<jobId>/`
- `data/models/<jobId>.glb`
- `data/work/<jobId>/` — 進捗と中間 USDZ/OBJ

## 開発

```bash
pnpm test
pnpm lint
pnpm build
```

## 免責

試作アプリです。復元品質は写真の取り方と Object Capture に依存します。測量や商用成果物の代替ではありません。Vercel 等のサーバレスでは動きません。
