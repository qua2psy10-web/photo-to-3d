import assert from "node:assert/strict";
import { test } from "node:test";
import { MESSAGES } from "../src/lib/messages";
import { getDummyTask } from "../src/lib/providers/dummy";
import { FAKE_PROGRESS } from "../src/lib/types";
import type { Job } from "../src/lib/types";

function job(over: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    status: "queued",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    imageCount: 4,
    imagePaths: ["uploads/job-1/000.jpg"],
    provider: "dummy",
    providerTaskId: "dummy-job-1",
    ...over,
  };
}

const t0 = Date.parse("2026-01-01T00:00:00.000Z");

test("dummy stays queued before queuedUntilMs", () => {
  const result = getDummyTask(job(), t0 + FAKE_PROGRESS.queuedUntilMs - 1);
  assert.equal(result.status, "queued");
  assert.ok(result.progress <= 20);
});

test("dummy is processing between queued and done", () => {
  const result = getDummyTask(job(), t0 + FAKE_PROGRESS.queuedUntilMs + 10);
  assert.equal(result.status, "processing");
  assert.ok(result.progress > 0);
  assert.ok(result.progress < 100);
});

test("dummy becomes ready after processingUntilMs", () => {
  const result = getDummyTask(job(), t0 + FAKE_PROGRESS.processingUntilMs);
  assert.equal(result.status, "ready");
  assert.equal(result.progress, 100);
  assert.equal(result.modelUrl, "/samples/demo.glb");
});

test("dummy simulated fail uses Japanese copy", () => {
  const result = getDummyTask(
    job({ simulateFail: true }),
    t0 + FAKE_PROGRESS.processingUntilMs,
  );
  assert.equal(result.status, "failed");
  assert.equal(result.errorMessage, MESSAGES.dummy_simulated_fail);
});

test("already-ready jobs stay ready", () => {
  const result = getDummyTask(
    job({ status: "ready", modelUrl: "/api/jobs/job-1/model" }),
    t0,
  );
  assert.equal(result.status, "ready");
  assert.equal(result.modelUrl, "/api/jobs/job-1/model");
});
