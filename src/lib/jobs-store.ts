import type { Job } from "./types";

/**
 * Placeholder only — no DB / persistence in Week1.
 * Week2 will replace this with a real store + reconstruction API.
 */
const memory: Map<string, Job> = new Map();

export function getJob(_id: string): Job | undefined {
  return memory.get(_id);
}

export function listJobs(): Job[] {
  return Array.from(memory.values());
}

export function saveJob(job: Job): void {
  memory.set(job.id, job);
}
