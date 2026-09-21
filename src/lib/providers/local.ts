import { MESSAGES } from "@/lib/messages";
import { localGlbPath, publicModelUrl } from "@/lib/model-store";
import {
  isPidAlive,
  readProgress,
  writeProgress,
} from "@/lib/photogrammetry/progress";
import { spawnWorker } from "@/lib/photogrammetry/worker";
import type { Job } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";
import fs from "fs";

export const localProvider: ReconstructionProvider = {
  name: "local",

  async createTask(input: CreateTaskInput) {
    const pid = spawnWorker(input.jobId, input.imagePaths);
    writeProgress(input.jobId, {
      status: "queued",
      progress: 1,
      stage: "queued",
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

    if (!isPidAlive(p.pid) && p.status !== "ready") {
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
      providerTaskId: job.providerTaskId,
    };
  },
};
