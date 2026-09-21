# Week3 — dummy product slice

A3: reconstruction stays **dummy** (no Meshy / Tripo calls).  
B2: branch `feat/week3-dummy-product`.  
C: uploader limits, dummy provider polish, local GLB persist, Japanese errors, tests, local run docs.

## Behaviour

- Upload **4–40** stills (warn below 8, recommend 12). JPG / PNG / WebP, 15 MB each.
- Dummy job: queued (~3 s) → processing (~12 s) → ready.
- Ready copies `public/samples/demo.glb` to `data/models/<jobId>.glb`.
- Viewer loads `/api/jobs/<id>/model` (auth cookie). Survives process restart.
- `DUMMY_SIMULATE_FAIL_RATE` default **0**. Set e.g. `1` to exercise retry.
- `RECONSTRUCTION_PROVIDER=tripo` fails immediately with a Japanese “未設定” message. No network.

## Local run

See README. `pnpm test && pnpm lint && pnpm build`.
