import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { MESSAGES } from "@/lib/messages";
import {
  jobWorkDir,
  readProgress,
  writeProgress,
} from "@/lib/photogrammetry/progress";

export function cancelFlagPath(jobId: string): string {
  return path.join(jobWorkDir(jobId), "cancel");
}

export function requestCancel(jobId: string): void {
  fs.writeFileSync(cancelFlagPath(jobId), new Date().toISOString(), "utf8");
}

export function isCancelRequested(jobId: string): boolean {
  try {
    return fs.existsSync(cancelFlagPath(jobId));
  } catch {
    return false;
  }
}

/** True when this pid is the detached reconstruction worker or its CLI. */
export function isReconstructionProcess(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try {
    const command = execFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
      timeout: 2000,
    });
    return /worker-main|object-capture/.test(command);
  } catch {
    return false;
  }
}

/** Signal a detached worker and the children in its process group. */
export function stopProcessTree(pid: number | undefined): void {
  if (!pid || pid <= 1 || pid === process.pid) return;
  for (const signal of ["SIGTERM", "SIGKILL"] as const) {
    try {
      process.kill(-pid, signal);
    } catch {
      try {
        process.kill(pid, signal);
      } catch {
        /* already exited */
      }
    }
  }
}

/** Mark the local job cancelled and stop its worker when the pid is ours. */
export function cancelLocalWork(jobId: string): void {
  requestCancel(jobId);
  const current = readProgress(jobId);
  writeProgress(jobId, {
    status: "failed",
    progress: current?.progress ?? 0,
    stage: current?.stage,
    activity: MESSAGES.fail_cancelled,
    log: current?.log,
    errorMessage: MESSAGES.fail_cancelled,
    pid: current?.pid,
  });
  if (current?.pid && isReconstructionProcess(current.pid)) {
    stopProcessTree(current.pid);
  }
}
