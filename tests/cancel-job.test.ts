import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ensureSchema, resetDbForTests } from "../src/lib/db";
import { cancelJob, createJob, getJob } from "../src/lib/jobs-store";
import { ErrorCode, MESSAGES, UserFacingError } from "../src/lib/messages";
import {
  cancelLocalWork,
  isCancelRequested,
  isReconstructionProcess,
  stopProcessTree,
} from "../src/lib/photogrammetry/cancel";
import { readProgress, writeProgress } from "../src/lib/photogrammetry/progress";

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function eightPngs() {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
    buffer: PNG,
    originalName: `shot-${i}.png`,
    mimeType: "image/png",
  }));
}

async function withTempData<T>(fn: () => Promise<T>): Promise<T> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pto3d-cancel-"));
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

test("cancelJob marks a running dummy job failed and keeps it failed", async () => {
  await withTempData(async () => {
    const job = await createJob({ files: eightPngs() });
    const cancelled = await cancelJob(job.id);
    assert.ok(cancelled);
    assert.equal(cancelled.status, "failed");
    assert.equal(cancelled.errorMessage, MESSAGES.fail_cancelled);

    const db = await ensureSchema();
    await db.execute({
      sql: "UPDATE jobs SET created_at = ? WHERE id = ?",
      args: [new Date(Date.now() - 20_000).toISOString(), job.id],
    });
    const again = await getJob(job.id);
    assert.equal(again?.status, "failed");
    assert.equal(again?.errorMessage, MESSAGES.fail_cancelled);

    await assert.rejects(
      () => cancelJob(job.id),
      (err: unknown) =>
        err instanceof UserFacingError &&
        err.code === ErrorCode.cancel_not_running &&
        err.status === 409,
    );
  });
});

test("cancelJob refuses a finished job", async () => {
  await withTempData(async () => {
    const job = await createJob({ files: eightPngs() });
    const db = await ensureSchema();
    await db.execute({
      sql: "UPDATE jobs SET created_at = ? WHERE id = ?",
      args: [new Date(Date.now() - 20_000).toISOString(), job.id],
    });
    const ready = await getJob(job.id);
    assert.equal(ready?.status, "ready");
    await assert.rejects(
      () => cancelJob(job.id),
      (err: unknown) =>
        err instanceof UserFacingError && err.code === ErrorCode.cancel_not_running,
    );
  });
});

test("cancelLocalWork does not signal an unrelated pid", async () => {
  await withTempData(async () => {
    const child = spawn("sleep", ["30"], { stdio: "ignore" });
    try {
      writeProgress("local-cancel", {
        status: "processing",
        progress: 30,
        stage: "aligning",
        activity: "写真の位置を合わせています",
        pid: child.pid,
      });
      assert.equal(isReconstructionProcess(child.pid ?? 0), false);
      cancelLocalWork("local-cancel");
      assert.equal(isCancelRequested("local-cancel"), true);
      assert.equal(readProgress("local-cancel")?.errorMessage, MESSAGES.fail_cancelled);
      await new Promise((resolve) => setTimeout(resolve, 50));
      assert.equal(child.exitCode, null);
    } finally {
      child.kill("SIGKILL");
    }
  });
});

test("cancelLocalWork stops a detached worker process", async () => {
  await withTempData(async () => {
    const child = spawn(
      process.execPath,
      ["-e", "setInterval(() => {}, 1000)", "worker-main"],
      { detached: true, stdio: "ignore" },
    );
    const exited = new Promise<void>((resolve) => {
      child.once("exit", () => resolve());
    });
    try {
      assert.ok(child.pid);
      assert.equal(isReconstructionProcess(child.pid), true);
      writeProgress("kill-worker", {
        status: "processing",
        progress: 12,
        stage: "meshing",
        pid: child.pid,
      });
      cancelLocalWork("kill-worker");
      await Promise.race([
        exited,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("worker still running")), 1000),
        ),
      ]);
    } finally {
      child.kill("SIGKILL");
    }
  });
});

test("stopProcessTree ends a detached process group", async () => {
  const child = spawn("sleep", ["30"], { detached: true, stdio: "ignore" });
  const exited = new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
  });
  try {
    stopProcessTree(child.pid);
    await Promise.race([
      exited,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("process still running")), 1000),
      ),
    ]);
  } finally {
    child.kill("SIGKILL");
  }
});
