# Week2 — reconstruction API notes

> **Update (vessel):** Paid Meshy usage is paused for cost. The app does not call paid APIs.
> Current mode: **dummy vessel** (SQLite + disk images + /samples/demo.glb).
> **Next candidate: Tripo pay-as-you-go** — wire later in src/lib/providers/tripo.ts.
> Below is the Day1 comparison memo kept for reference.

---

調査日: 2026-09-05（Asia/Tokyo）  
リポジトリ: [photo-to-3d](https://github.com/qua2psy10-web/photo-to-3d)  
方針: **まず動かす / 商品・オブジェクト向き / 統合しやすい**（参謀優先度）

このドキュメントは **API 選定のみ**。アプリ実装・DB・認証・課金 UI は含まない。

---

## 1. 比較表

| 軸 | **Meshy** Multi-Image to 3D | **Tripo** Multiview to 3D | **Luma** (Dream Machine / Genie / Agents API) |
| --- | --- | --- | --- |
| **1. Multi vs single** | **1〜4 枚**専用エンドポイント。同一オブジェクトを異なる角度で。 | **2〜4 枚**（`front` 必須、`left`/`back`/`right`）。ラベル付きビュー。 | 現行公開 **Luma Agents API は image/video のみ**。multi-photo → mesh/GLB の公式エンドポイントは確認できず。 |
| **2. GLB** | **ネイティブ**。`target_formats: ["glb"]` → `model_urls.glb`。 | **ネイティブ**（完了時 `output.model_url` が `.glb` 例あり）。必要なら Convert API。 | 公開 Agents API では GLB 出力なし（image/video）。旧 Genie/3D は公式 docs 上で multi-photo 復元として使えない。 |
| **3. オブジェクト/商品向き** | ◎ 製品・小物の多視点想定。PBR / remesh / polycount 制御。 | ◎ e-commerce シナリオが Quick Start に明記。品質・PBR 強め。 | △ キャプチャ/シーン寄り。現行 API は本用途に不適合。 |
| **4. 価格 / 無料枠 / レート** | **API は Pro 以上必須**（Free は Web のみ）。Pro ≈ **$20/月・1,000 credits**（[pricing](https://www.meshy.ai/pricing)、2026 時点）。Multi-Image: **テクスチャなし 20 / あり 30 / 8K 35** credits（Meshy-6/7。[docs pricing](https://docs.meshy.ai/api/pricing.md)）。Pro: **20 RPS / 同時キュー 10**（[rate limits](https://docs.meshy.ai/en/api/rate-limits)）。 | **API は Studio と別課金**（PAYG）。**1 credit = $0.01**（[developers pricing](https://developers.tripo3d.ai/en/pricing)）。Multiview: **テクスチャなし 20 / Standard 30** + オプション。Studio Free のクレジットは API に使えない。 | Agents API は image/video 課金。3D multi-photo 向け料金は該当なし。 |
| **5. API DX** | POST 作成 → **GET ポーリング** / **SSE stream** / **Webhook**（最大 5）。Bearer。**image_urls に公開 URL または base64 data URI**。 | POST 作成 → **GET /v3/tasks/{id} ポーリング** / **Webhook**（HMAC 署名）。Bearer。URL / `file_token`。 | Agents: POST/GET generations（image/video）。本用途のジョブフローに使えない。 |
| **6. ToS / 商用 Web 埋め込み** | 有料プラン: 出力の商業利用・プライベート所有可。Free は CC BY 4.0（帰属必須）。API 利用は有料前提。[Terms](https://www.meshy.ai/terms-of-use)（Last Updated: March 7, 2026）。**Service 自体の再販は禁止**だが、生成 GLB を自社 Web アプリに埋め込む用途は有料プランで想定内。 | 有料/API: 商業利用可（Free Studio は非商用）。競合サービス構築への出力利用制限あり。[Help: commercial](https://www.tripo3d.ai/help/privacy-policy/can-i-use-models-commercially)。 | 3D 復元 API として選定対象外のため詳細省略。 |

### 第4候補について

CSM / Rodin 等は「明らかに Meshy/Tripo より multi-photo 商品→GLB で優位」とは言い切れず（取得・価格・DX の不確実性）、**追加比較は行わない**。

### 不確実性メモ

- Luma Genie の旧 Dream Machine 3D 経路はサードパーティ記述があるが、**2026-09 時点の公式 Agents docs では 3D mesh API が公開されていない**。
- Meshy のクレジット単価（$/credit）はプランによって実質単価が変わる。上表は公式の credit 消費と Pro 月額を併記。
- Tripo のレート詳細は docs の Rate Limits ページ参照（本調査では Multiview 料金と webhook を優先確認）。
- ToS は変更されうる。実装前に最新の Terms / Acceptable Use を再確認すること。

---

## 2. 選定: **Meshy Multi-Image to 3D**

**選ぶ理由（優先度順）**

1. **まず動かす** — `POST /openapi/v1/multi-image-to-3d` が「1〜4 枚 → タスク ID → GLB URL」と直線的。既存の `jobs` ポーリング UI（`/api/jobs/[id]`）にそのまま載せやすい。
2. **商品・オブジェクト向き** — 同一オブジェクトの多視点入力が公式想定。`enable_pbr` / `should_texture` / `target_formats: ["glb"]` で Web 表示（model-viewer）まで最短。
3. **統合しやすい** — **base64 data URI** 可 → Week2 で画像をまだ公開 CDN に置かなくても試作可能。SSE と Webhook もあり、初期はポーリングで足りる。
4. **ドキュメントが一次ソースで揃っている** — [Multi-Image to 3D](https://docs.meshy.ai/en/api/multi-image-to-3d)、[Auth](https://docs.meshy.ai/en/api/authentication)、[Pricing](https://docs.meshy.ai/api/pricing.md)、[Webhooks](https://docs.meshy.ai/en/api/webhooks)、[Rate limits](https://docs.meshy.ai/en/api/rate-limits)。

**Tripo を選ばなかった理由（近いが後回し）**

- ビューが `front` 必須のラベル付きで、現状アップローダ（枚数だけ）とのギャップが大きい。
- Studio と API が別課金で、オンボーディングが一段多い。
- Webhook HMAC は本番向きだが、Day2 の「まず繋ぐ」では Meshy のポーリングで十分。

**Luma を選ばない理由**

- 現行公開 API が multi-photo → GLB 復元になっていない。

---

## 3. アカウント / API キー手順（ユーザー作業）

> キーは **ユーザーが取得**する。エージェント環境にキーは無い。**絶対に git にコミットしない**（`.gitignore` に `.env*` あり）。

1. [https://www.meshy.ai/](https://www.meshy.ai/) でアカウント作成・ログインする。
2. **Pro 以上にアップグレード**する（API は Free 不可。Pro ≈ $20/月・1,000 credits — [pricing](https://www.meshy.ai/pricing)）。
3. 画面上部の **API**（または [API settings](https://www.meshy.ai/) 内の API ページ）を開く。
4. **Create API Key** を押し、名前を付ける（例: `photo-to-3d-dev`）。
5. 表示されたキー（`msy_...` 形式）を **一度だけ**コピーし、パスワードマネージャ等に保存する（再表示不可）。
6. ローカルで環境変数を設定する（リポジトリ直下の `.env.local` 推奨。コミット禁止）:

```bash
# .env.local（コミットしない）
MESHY_API_KEY=msy_REPLACE_ME
```

7. （任意）同じ API 設定ページで **Webhook** を後から追加可能（HTTPS URL、最大 5）。Day2 初期はポーリングでよい。
8. クレジット残高を確認し、不足なら追加購入（Multi-Image + texture ≈ **30 credits/回**）。

---

## 4. フロー概要: submit → complete → GLB

Base: `https://api.meshy.ai`  
Auth: `Authorization: Bearer ${MESHY_API_KEY}`

```
[アプリ] 複数写真 (1–4)
    │  image_urls: 公開URL または data:image/...;base64,...
    ▼
POST /openapi/v1/multi-image-to-3d
    │  body: { image_urls, should_texture, enable_pbr?, target_formats: ["glb"], ... }
    │  → { "result": "<task_id>" }
    ▼
GET  /openapi/v1/multi-image-to-3d/<task_id>   （数秒おきにポーリング）
  または GET .../<task_id>/stream               （SSE）
  または Webhook POST → 自サーバー              （status 変化時）
    │
    │  status: PENDING → IN_PROGRESS → SUCCEEDED | FAILED | CANCELED
    │  progress: 0..100
    ▼
SUCCEEDED 時: model_urls.glb をダウンロード（署名付き URL・期限あり）
    ▼
自前ストレージ or 一時 URL を Job.modelUrl に保存 → model-viewer で表示
```

### エンドポイント早見

| 操作 | Method | Path |
| --- | --- | --- |
| タスク作成 | `POST` | `/openapi/v1/multi-image-to-3d` |
| 状態取得 | `GET` | `/openapi/v1/multi-image-to-3d/:id` |
| SSE | `GET` | `/openapi/v1/multi-image-to-3d/:id/stream` |
| 削除 | `DELETE` | `/openapi/v1/multi-image-to-3d/:id` |
| 一覧 | `GET` | `/openapi/v1/multi-image-to-3d` |

主要な作成パラメータ（抜粋）:

- `image_urls` (1–4) — jpg/jpeg/png。URL または data URI
- `ai_model` — `meshy-5` / `meshy-6` / `meshy-7` / `latest`（既定 `latest` = Meshy 7）
- `should_texture` — 既定 `true`
- `enable_pbr` — PBR マップ
- `target_formats` — 例 `["glb"]`（省略時は 3mf 以外ほぼ全部生成 → 完了が遅くなるので **GLB だけ指定推奨**）

失敗時の代表: `401` キー不正、`402` クレジット不足、`429` レート制限。

---

## 5. curl 例（キー必須 — 実行はユーザー）

**この調査時点では `MESHY_API_KEY` が環境に無いため、実リクエストは実行していない。**  
キー取得後、以下をローカルで実行する。

```bash
export MESHY_API_KEY="msy_REPLACE_ME"

# 1) タスク作成（公開画像 URL の例 — 実運用では自前ホスト or data URI）
curl -sS https://api.meshy.ai/openapi/v1/multi-image-to-3d \
  -X POST \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_urls": [
      "https://EXAMPLE.com/product-front.jpg",
      "https://EXAMPLE.com/product-side.jpg"
    ],
    "should_texture": true,
    "enable_pbr": true,
    "target_formats": ["glb"]
  }'
# → {"result":"<task_id>"}

# 2) ポーリング
TASK_ID="<task_id>"
curl -sS "https://api.meshy.ai/openapi/v1/multi-image-to-3d/${TASK_ID}" \
  -H "Authorization: Bearer ${MESHY_API_KEY}"
# status が SUCCEEDED になるまで繰り返し
# → model_urls.glb を取得して保存

# 3)（任意）SSE
curl -N "https://api.meshy.ai/openapi/v1/multi-image-to-3d/${TASK_ID}/stream" \
  -H "Authorization: Bearer ${MESHY_API_KEY}"
```

**data URI 版のイメージ**（画像を一時的に公開したくない場合）:

```bash
# 先頭だけ。実ファイルは base64 を埋め込む
curl -sS https://api.meshy.ai/openapi/v1/multi-image-to-3d \
  -X POST \
  -H "Authorization: Bearer ${MESHY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "image_urls": [
      "data:image/jpeg;base64,/9j/4AAQ..."
    ],
    "target_formats": ["glb"]
  }'
```

---

## 6. Week2 Day2 への引き渡し

既存フロー（Week1）:

- `POST /api/jobs` → メモリ上 Job（`queued` → fake `processing` → `ready` + `/samples/demo.glb`）
- クライアントが `/api/jobs/[id]` をポーリング

Day2 でやること（案）:

1. サーバに `MESHY_API_KEY` を読ませる（`.env.local`）。
2. ジョブ作成時にアップロード画像を Meshy へ渡す（初期は **data URI** または一時公開 URL）。
3. Meshy `task_id` を Job に紐付け、fake 進捗をやめ、Meshy の `progress` / `status` をマップする。
4. `SUCCEEDED` で `model_urls.glb` を取得し `Job.modelUrl` にセット（必要なら自前に再ホスト。Meshy 署名 URL は期限切れ注意）。
5. 失敗時は `failed` + エラーメッセージ。
6. （後続）Webhook or SSE でポーリング負荷を下げる。

**環境変数名（プレースホルダ）:** `MESHY_API_KEY`

---

## 7. 一次ソース一覧

| 内容 | URL |
| --- | --- |
| Meshy Multi-Image API | https://docs.meshy.ai/en/api/multi-image-to-3d |
| Meshy Auth | https://docs.meshy.ai/en/api/authentication |
| Meshy Pricing (API credits) | https://docs.meshy.ai/api/pricing.md |
| Meshy Rate limits | https://docs.meshy.ai/en/api/rate-limits |
| Meshy Webhooks | https://docs.meshy.ai/en/api/webhooks |
| Meshy Plans | https://www.meshy.ai/pricing |
| Meshy Terms | https://www.meshy.ai/terms-of-use |
| Tripo Multiview | https://developers.tripo3d.ai/en/docs/generation-multiview-to-model |
| Tripo Pricing | https://developers.tripo3d.ai/en/pricing |
| Tripo Webhooks | https://developers.tripo3d.ai/en/docs/webhooks |
| Tripo Quick Start | https://developers.tripo3d.ai/en/docs/quick-start |
| Luma Agents API | https://docs.agents.lumalabs.ai/ |
