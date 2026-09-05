import type { Job } from "./types";
import { FAKE_PROGRESS } from "./types";

/**
 * Placeholder only — no DB / persistence in Week1.
 * Week2 will replace this with a real store + reconstruction API.
 *
 * Fake progress advances deterministically on read based on createdAt
 * (no flaky setInterval across HMR): 0–3s queued, 3–12s processing, ≥12s ready.
 */
const memory: Map<string, Job> = new Map();

function elapsedMs(job: Job, now = Date.now()): number {
  return Math.max(0, now - new Date(job.createdAt).getTime());
}

/** Advance job status from elapsed time; mutates stored job when status changes. */
export function advanceJob(job: Job, now = Date.now()): Job {
  // Terminal states stay put
  if (job.status === "ready" || job.status === "failed" || job.status === "completed") {
    return job;
  }

  const ms = elapsedMs(job, now);
  let next: Job = job;

  if (ms >= FAKE_PROGRESS.processingUntilMs) {
    if (job.simulateFail) {
      next = { ...job, status: "failed", modelUrl: undefined };
    } else {
      next = {
        ...job,
        status: "ready",
        modelUrl: job.modelUrl ?? "/samples/demo.glb",
      };
    }
  } else if (ms >= FAKE_PROGRESS.queuedUntilMs) {
    if (job.status !== "processing") {
      next = { ...job, status: "processing" };
    }
  } else {
    if (job.status !== "queued") {
      next = { ...job, status: "queued" };
    }
  }

  if (next !== job) {
    memory.set(next.id, next);
  }
  return next;
}

export function getJob(id: string): Job | undefined {
  const job = memory.get(id);
  if (!job) return undefined;
  return advanceJob(job);
}

export function listJobs(): Job[] {
  return Array.from(memory.values()).map((j) => advanceJob(j));
}

export function saveJob(job: Job): void {
  memory.set(job.id, job);
}

/** 0–100 progress estimate for waiting UI (based on createdAt). */
export function jobProgressPercent(job: Job, now = Date.now()): number {
  if (job.status === "ready" || job.status === "completed") return 100;
  if (job.status === "failed") return 100;
  const ms = elapsedMs(job, now);
  const total = FAKE_PROGRESS.processingUntilMs;
  return Math.min(99, Math.floor((ms / total) * 100));
}
