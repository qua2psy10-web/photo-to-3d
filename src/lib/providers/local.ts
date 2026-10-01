import { MESSAGES } from "@/lib/messages";
import { localGlbPath, publicModelUrl } from "@/lib/model-store";
import {
  isPidAlive,
  readProgress,
  writeProgress,
  type ProgressFile,
} from "@/lib/photogrammetry/progress";
import {
  isCaptureStage,
  publicLog,
  STAGE_ACTIVITY,
} from "@/lib/photogrammetry/stages";
import { spawnWorker } from "@/lib/photogrammetry/worker";
import type { Job } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";
import fs from "fs";

function liveFromProgress(p: ProgressFile) {
  const stage = isCaptureStage(p.stage) ? p.stage : undefined;
  const activity =
    typeof p.activity === "string" && p.activity.trim()
      ? p.activity
      : stage
        ? STAGE_ACTIVITY[stage]
        : undefined;
  const log = publicLog(p.log);
  return {
    ...(stage ? { stage } : {}),
    ...(activity ? { activity } : {}),
    ...(log ? { log } : {}),
  };
}

export const localProvider: ReconstructionProvider = {
  name: "local",

  async createTask(input: CreateTaskInput) {
    const pid = spawnWorker(input.jobId, input.imagePaths);
    writeProgress(input.jobId, {
      status: "queued",
      progress: 1,
      stage: "queued",
      activity: STAGE_ACTIVITY.queued,
      log: [STAGE_ACTIVITY.queued],
      pid,
    });
    return { providerTaskId: pid ? `local-${pid}` : `local-${input.jobId}` };
  },

  async getTask(job: Job): Promise<GetTaskResult> {
    const glb = localGlbPath(job.id);
    if (fs.existsSync(glb) && fs.statSync(glb).size > 100) {
      return {
        status: "ready",
        progress: 100,
        modelUrl: publicModelUrl(job.id),
        providerTaskId: job.providerTaskId,
      };
    }

    const p = readProgress(job.id);
    if (!p) {
      return {
        status: job.status === "queued" ? "queued" : "processing",
        progress: 1,
        providerTaskId: job.providerTaskId,
      };
    }

    if (p.status === "ready") {
      if (fs.existsSync(glb) && fs.statSync(glb).size > 100) {
        return {
          status: "ready",
          progress: 100,
          modelUrl: publicModelUrl(job.id),
          providerTaskId: job.providerTaskId,
        };
      }
      return {
        status: "failed",
        progress: 100,
        errorMessage: MESSAGES.local_convert_failed,
        providerTaskId: job.providerTaskId,
      };
    }

    if (p.status === "failed") {
      return {
        status: "failed",
        progress: 100,
        errorMessage: p.errorMessage ?? MESSAGES.local_capture_failed,
        providerTaskId: job.providerTaskId,
      };
    }

    if (!isPidAlive(p.pid)) {
      return {
        status: "failed",
        progress: 100,
        errorMessage: p.errorMessage ?? MESSAGES.local_capture_failed,
        providerTaskId: job.providerTaskId,
      };
    }

    return {
      status: p.status,
      progress: p.progress,
      ...liveFromProgress(p),
      providerTaskId: job.providerTaskId,
    };
  },
};
