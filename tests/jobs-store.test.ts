import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ensureSchema, getDataDir, resetDbForTests } from "../src/lib/db";
import { createJob, getJob } from "../src/lib/jobs-store";
import { ErrorCode, UserFacingError } from "../src/lib/messages";
import { localGlbPath } from "../src/lib/model-store";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function fourPngs() {
  return [0, 1, 2, 3].map((i) => ({
    buffer: PNG,
    originalName: `shot-${i}.png`,
    mimeType: "image/png",
  }));
}

async function withTempData<T>(fn: () => Promise<T>): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pto3d-jobs-"));
  process.env.PHOTO_TO_3D_DATA_DIR = dir;
  process.env.RECONSTRUCTION_PROVIDER = "dummy";
  resetDbForTests();
  try {
    return await fn();
  } finally {
    resetDbForTests();
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.PHOTO_TO_3D_DATA_DIR;
  }
}

test("createJob rejects three images", async () => {
  await withTempData(async () => {
    await assert.rejects(
      () => createJob({ files: fourPngs().slice(0, 3) }),
      (err: unknown) =>
        err instanceof UserFacingError && err.code === ErrorCode.too_few_images,
    );
  });
});

test("createJob stores images and dummy ready copies a local GLB", async () => {
  await withTempData(async () => {
    const job = await createJob({ files: fourPngs() });
    assert.equal(job.status, "queued");
    assert.equal(job.imageCount, 4);
    assert.equal(job.provider, "dummy");
    for (const rel of job.imagePaths) {
      assert.equal(fs.existsSync(path.join(getDataDir(), rel)), true);
    }

    const db = await ensureSchema();
    const past = new Date(Date.now() - 20_000).toISOString();
    await db.execute({
      sql: "UPDATE jobs SET created_at = ? WHERE id = ?",
      args: [past, job.id],
    });

    const ready = await getJob(job.id);
    assert.ok(ready);
    assert.equal(ready.status, "ready");
    assert.equal(ready.modelUrl, `/api/jobs/${job.id}/model`);
    assert.equal(fs.existsSync(localGlbPath(job.id)), true);
    assert.ok(fs.statSync(localGlbPath(job.id)).size > 0);
  });
});

test("simulateFail becomes failed with Japanese message", async () => {
  await withTempData(async () => {
    const job = await createJob({ files: fourPngs(), simulateFail: true });
    const db = await ensureSchema();
    const past = new Date(Date.now() - 20_000).toISOString();
    await db.execute({
      sql: "UPDATE jobs SET created_at = ? WHERE id = ?",
      args: [past, job.id],
    });
    const failed = await getJob(job.id);
    assert.ok(failed);
    assert.equal(failed.status, "failed");
    assert.ok(failed.errorMessage?.includes("ダミー"));
  });
});
