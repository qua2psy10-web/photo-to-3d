import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { ensureSchema, getDb, resetDbForTests } from "../src/lib/db";
import { createJob, getJob, retryJob } from "../src/lib/jobs-store";
import {
  defaultDetail,
  detailLabel,
  parseDetail,
} from "../src/lib/photogrammetry/detail";
import { writeWorkerInput } from "../src/lib/photogrammetry/worker";

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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pto3d-detail-"));
  const previousDetail = process.env.PHOTOGRAMMETRY_DETAIL;
  process.env.PHOTO_TO_3D_DATA_DIR = dir;
  process.env.RECONSTRUCTION_PROVIDER = "dummy";
  delete process.env.PHOTOGRAMMETRY_DETAIL;
  resetDbForTests();
  try {
    return await fn();
  } finally {
    resetDbForTests();
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.PHOTO_TO_3D_DATA_DIR;
    if (previousDetail === undefined) delete process.env.PHOTOGRAMMETRY_DETAIL;
    else process.env.PHOTOGRAMMETRY_DETAIL = previousDetail;
  }
}

test("parseDetail accepts the five CLI values and rejects anything else", () => {
  assert.equal(parseDetail(" Full "), "full");
  assert.equal(parseDetail("raw"), "raw");
  assert.equal(parseDetail("preview"), "preview");
  assert.equal(parseDetail("reduced"), "reduced");
  assert.equal(parseDetail("medium"), "medium");
  assert.equal(parseDetail("ultra"), null);
  assert.equal(parseDetail(""), null);
  assert.equal(parseDetail(1), null);
  assert.equal(detailLabel("full"), "高");
  assert.equal(detailLabel("nope"), undefined);
});

test("defaultDetail follows PHOTOGRAMMETRY_DETAIL and otherwise stays medium", () => {
  const previous = process.env.PHOTOGRAMMETRY_DETAIL;
  try {
    delete process.env.PHOTOGRAMMETRY_DETAIL;
    assert.equal(defaultDetail(), "medium");
    process.env.PHOTOGRAMMETRY_DETAIL = "preview";
    assert.equal(defaultDetail(), "preview");
    process.env.PHOTOGRAMMETRY_DETAIL = "nope";
    assert.equal(defaultDetail(), "medium");
  } finally {
    if (previous === undefined) delete process.env.PHOTOGRAMMETRY_DETAIL;
    else process.env.PHOTOGRAMMETRY_DETAIL = previous;
  }
});

test("createJob stores the chosen detail and retry keeps it", async () => {
  await withTempData(async () => {
    const job = await createJob({ files: eightPngs(), detail: "full" });
    assert.equal(job.detail, "full");
    const loaded = await getJob(job.id);
    assert.equal(loaded?.detail, "full");
    const retried = await retryJob(job.id);
    assert.equal(retried?.detail, "full");
  });
});

test("writeWorkerInput puts detail in the worker file", async () => {
  await withTempData(async () => {
    const file = writeWorkerInput("job-detail", ["uploads/a.jpg"], "raw");
    const body = JSON.parse(fs.readFileSync(file, "utf8")) as { detail?: string };
    assert.equal(body.detail, "raw");
  });
});

test("ensureSchema adds detail to an older jobs table", async () => {
  await withTempData(async () => {
    const db = getDb();
    await db.execute(`
      CREATE TABLE jobs (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        image_count INTEGER NOT NULL DEFAULT 0,
        model_url TEXT,
        error_message TEXT,
        simulate_fail INTEGER NOT NULL DEFAULT 0,
        provider TEXT,
        provider_task_id TEXT
      )
    `);
    await ensureSchema();
    const info = await db.execute("PRAGMA table_info(jobs)");
    const names = info.rows.map((row) => String(row.name ?? ""));
    assert.ok(names.includes("detail"), `columns: ${names.join(",")}`);
  });
});
