import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resetDbForTests } from "../src/lib/db";
import { localGlbPath } from "../src/lib/model-store";
import { writeProgress } from "../src/lib/photogrammetry/progress";
import { rewriteMtlTextureRefs } from "../src/lib/photogrammetry/worker";
import { localProvider } from "../src/lib/providers/local";
import type { Job } from "../src/lib/types";

function job(over: Partial<Job> = {}): Job {
  return {
    id: "local-job-1",
    status: "processing",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageCount: 8,
    imagePaths: [],
    provider: "local",
    ...over,
  };
}

async function withTemp<T>(fn: () => Promise<T>): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pto3d-local-"));
  process.env.PHOTO_TO_3D_DATA_DIR = dir;
  resetDbForTests();
  try {
    return await fn();
  } finally {
    resetDbForTests();
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.PHOTO_TO_3D_DATA_DIR;
  }
}

test("local getTask reports processing from progress file", async () => {
  await withTemp(async () => {
    writeProgress("local-job-1", {
      status: "processing",
      progress: 40,
      stage: "analyzing",
      pid: process.pid,
    });
    const result = await localProvider.getTask(job());
    assert.equal(result.status, "processing");
    assert.equal(result.progress, 40);
  });
});

test("local getTask is ready only when GLB exists", async () => {
  await withTemp(async () => {
    writeProgress("local-job-1", {
      status: "ready",
      progress: 100,
      stage: "done",
    });
    const missing = await localProvider.getTask(job());
    assert.equal(missing.status, "failed");

    fs.mkdirSync(path.dirname(localGlbPath("local-job-1")), { recursive: true });
    fs.writeFileSync(localGlbPath("local-job-1"), Buffer.alloc(200, 1));
    const ready = await localProvider.getTask(job());
    assert.equal(ready.status, "ready");
    assert.equal(ready.modelUrl, "/api/jobs/local-job-1/model");
  });
});

test("rewriteMtlTextureRefs unwraps ModelIO usdz texture paths", () => {
  const mtl = "map_Kd model.usdz[0/baked_mesh_tex0.png]\n";
  assert.equal(rewriteMtlTextureRefs(mtl).trim(), "map_Kd baked_mesh_tex0.png");
});

test("local getTask failed copies Japanese error", async () => {
  await withTemp(async () => {
    writeProgress("local-job-1", {
      status: "failed",
      progress: 100,
      errorMessage: "3D 復元に失敗しました。明るい場所で、重なりのある写真を増やして再試行してください。",
    });
    const result = await localProvider.getTask(job());
    assert.equal(result.status, "failed");
    assert.ok(result.errorMessage?.includes("失敗"));
  });
});
