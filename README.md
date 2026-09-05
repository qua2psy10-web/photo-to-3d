# photo-to-3d

写真から3Dモデルを生成する Web アプリ（Week1 スキャフォールド）

第1週: UIのみ / 第2週: 復元API

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- pnpm
- `@google/model-viewer` (+ peer `three`)

## Routes

| Path | Description |
|------|-------------|
| `/` | ホーム |
| `/jobs/new` | 新規ジョブ |
| `/jobs/[id]` | ジョブ詳細（待機 → 実GLBプレビュー） |
| `/api/jobs` | ジョブ API（スタブ） |
| `/api/jobs/[id]` | ジョブ詳細 API（スタブ） |

## Dev

```bash
pnpm install
pnpm dev
```

## Sample GLB

`public/samples/demo.glb` — Khronos glTF Sample Models — Box (Apache-2.0 / Cesium).
Source tree: KhronosGroup/glTF-Sample-Models (2.0/Box).
Week1 ready jobs point here until real reconstruction exists. See `public/samples/README.md`.

## Notes

- 復元 API / DB / 認証は未実装（第2週以降）
- Week1 Day5: `@google/model-viewer` で実GLB表示・ダウンロード・全画面
