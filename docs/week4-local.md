# Week4 — local Object Capture

A4: reconstruction on this Mac via RealityKit `PhotogrammetrySession`. No Meshy/Tripo.

- CLI: `tools/object-capture` (Swift). First job runs `swift build -c release` if the binary is missing.
- Worker: detached `tsx src/lib/photogrammetry/worker-main.ts`. Progress in `data/work/<id>/progress.json`.
- USDZ → OBJ (ModelIO) → GLB (`obj2gltf`) → `data/models/<id>.glb`.
- Default `RECONSTRUCTION_PROVIDER=local`. Set `dummy` to get the cube demo again.
