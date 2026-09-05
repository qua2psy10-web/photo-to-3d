# photo-to-3d

写真から3Dモデルを生成する Web アプリ（Week1 スキャフォールド）

第1週: UIのみ / 第2週: 復元API

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- pnpm
- `@google/model-viewer`

## Routes

| Path | Description |
|------|-------------|
| `/` | ホーム |
| `/jobs/new` | 新規ジョブ |
| `/jobs/[id]` | ジョブ詳細 |
| `/api/jobs` | ジョブ API（スタブ） |
| `/api/jobs/[id]` | ジョブ詳細 API（スタブ） |

## Dev

```bash
pnpm install
pnpm dev
```

## Notes

- 復元 API / DB / 認証は未実装（第2週以降）
