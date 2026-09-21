# photo-to-3d

複数の角度から撮った写真を上げて、ブラウザで 3D（GLB）を見る Web アプリです。

**いまの復元はシミュレーションです。** 入力写真の形状は計算せず、デモ用の立方体 GLB を出します。有料の Meshy / Tripo API は呼びません。

## 使い方

1. **撮る** — 被写体を一周。最低 4 枚、推奨 12 枚前後、最大 40 枚。JPG / PNG / WebP。
2. **上げる** — `/login` のあと `/jobs/new` にドロップ。
3. **待つ** — 約 12 秒でプレビュー。履歴 `/jobs` から再開できます。

## セットアップ（ローカル）

Node.js 20+ と [pnpm](https://pnpm.io/) 10。

```bash
git clone https://github.com/qua2psy10-web/photo-to-3d.git
cd photo-to-3d
pnpm install
cp .env.example .env.local
# 必要なら APP_SECRET を書き換える
pnpm dev
```

ブラウザで http://localhost:3000 。ログインの開発既定値は `dev-secret-change-me`（`.env.local` の `APP_SECRET`）。

本番相当の起動:

```bash
pnpm build
pnpm start
```

本番では `APP_SECRET` を必ず設定してください。未設定だと起動時に落ちます。

## 環境変数

| 名前 | 意味 |
| --- | --- |
| `APP_SECRET` | ログイン用共有シークレット |
| `RECONSTRUCTION_PROVIDER` | `dummy`（既定）または `tripo`（未配線で失敗） |
| `DUMMY_SIMULATE_FAIL_RATE` | 0–1。ダミー失敗の確率。既定 0 |
| `PHOTO_TO_3D_DATA_DIR` | SQLite・写真・GLB の保存先。既定 `./data` |

キーや `.env.local` は git に入れないでください。

## データ

`data/`（gitignore 済）に残ります。プロセス再起動後も履歴と GLB を開けます。

- `data/photo-to-3d.db`
- `data/uploads/<jobId>/`
- `data/models/<jobId>.glb`

## 開発

```bash
pnpm test
pnpm lint
pnpm build
```

## 免責

これは設計補助・試作アプリです。生成品質は入力と（将来つなぐ場合は）外部 API に依存します。現スライスの GLB はデモ立方体であり、測量・商用成果物の代替ではありません。
