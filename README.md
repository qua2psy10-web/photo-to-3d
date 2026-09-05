# photo-to-3d

Photo to 3D web app. Week2 vessel only: disk upload, SQLite, auth, dummy reconstruction.
No paid reconstruction API calls. Display uses /samples/demo.glb.
Tripo wiring comes later via src/lib/providers/tripo.ts.

## Stack

- Next.js App Router, TypeScript, Tailwind
- @libsql/client file SQLite under data/
- @google/model-viewer

## Routes

- / home
- /login shared-secret login
- /jobs history (auth required)
- /jobs/new multipart upload
- /jobs/[id] detail then dummy GLB
- API under /api/jobs for list, create, detail, retry, images

## Setup

Install deps, copy env example to local env, start the Next.js dev server.

### Login

Open /login and enter the shared secret from env (dev default documented in env example).
Unauthenticated job pages redirect to login.

### Providers

Env RECONSTRUCTION_PROVIDER: dummy (default) or tripo (stub not configured).

## Data

Folder data/ holds uploads and SQLite; ignored by git; survives restart.

## Notes

Paid multi-image APIs are paused for cost. Next candidate is Tripo later.
Done when production build passes and dummy end-to-end works.
