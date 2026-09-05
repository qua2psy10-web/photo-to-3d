import type { Job } from "@/lib/types";
import { DEMO_MODEL_URL, FAKE_PROGRESS } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";

function elapsedMs(createdAt: string, now = Date.now()): number {
  return Math.max(0, now - new Date(createdAt).getTime());
}

/**
 * Local vessel provider: advances queued → processing → ready/failed
 * deterministically from createdAt (advance-on-read). No external API.
 */
export const dummyProvider: ReconstructionProvider = {
  name: "dummy",

  async createTask(_input: CreateTaskInput) {
    // Nothing to call — progress is derived from timestamps on getTask.
    return { providerTaskId: `dummy-${_input.jobId}` };
  },

  async getTask(job: Job): Promise<GetTaskResult> {
    if (job.status === "ready" || job.status === "completed") {
      return {
        status: "ready",
        progress: 100,
        modelUrl: job.modelUrl ?? DEMO_MODEL_URL,
        providerTaskId: job.providerTaskId,
      };
    }
    if (job.status === "failed") {
      return {
        status: "failed",
        progress: 100,
        errorMessage:
          job.errorMessage ??
          "Reconstruction failed. Please retry with the same or new photos.",
        providerTaskId: job.providerTaskId,
      };
    }

    const ms = elapsedMs(job.createdAt);

    if (ms >= FAKE_PROGRESS.processingUntilMs) {
      if (job.simulateFail) {
        return {
          status: "failed",
          progress: 100,
          errorMessage:
            "Dummy provider simulated a failure so the retry UI can be tested.",
          providerTaskId: job.providerTaskId,
        };
      }
      return {
        status: "ready",
        progress: 100,
        modelUrl: DEMO_MODEL_URL,
        providerTaskId: job.providerTaskId,
      };
    }

    if (ms >= FAKE_PROGRESS.queuedUntilMs) {
      const total = FAKE_PROGRESS.processingUntilMs;
      return {
        status: "processing",
        progress: Math.min(99, Math.floor((ms / total) * 100)),
        providerTaskId: job.providerTaskId,
      };
    }

    const total = FAKE_PROGRESS.processingUntilMs;
    return {
      status: "queued",
      progress: Math.min(20, Math.floor((ms / total) * 100)),
      providerTaskId: job.providerTaskId,
    };
  },
};
