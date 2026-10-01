import { MESSAGES } from "@/lib/messages";
import { STAGE_ACTIVITY, type CaptureStage } from "@/lib/photogrammetry/stages";
import type { Job } from "@/lib/types";
import { DEMO_MODEL_URL, FAKE_PROGRESS } from "@/lib/types";
import type {
  CreateTaskInput,
  GetTaskResult,
  ReconstructionProvider,
} from "./types";

export function elapsedMs(createdAt: string, now = Date.now()): number {
  return Math.max(0, now - new Date(createdAt).getTime());
}

function dummyLive(progress: number, status: "queued" | "processing"): {
  stage: CaptureStage;
  activity: string;
} {
  if (status === "queued") {
    return { stage: "queued", activity: STAGE_ACTIVITY.queued };
  }
  const stage: CaptureStage =
    progress < 25
      ? "analyzing"
      : progress < 45
        ? "aligning"
        : progress < 70
          ? "meshing"
          : progress < 90
            ? "texturing"
            : "converting";
  return { stage, activity: STAGE_ACTIVITY[stage] };
}

/** Deterministic dummy timeline. `now` is injectable for tests. */
export function getDummyTask(job: Job, now = Date.now()): GetTaskResult {
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
      errorMessage: job.errorMessage ?? MESSAGES.dummy_generic_fail,
      providerTaskId: job.providerTaskId,
    };
  }

  const ms = elapsedMs(job.createdAt, now);
  const total = FAKE_PROGRESS.processingUntilMs;

  if (ms >= FAKE_PROGRESS.processingUntilMs) {
    if (job.simulateFail) {
      return {
        status: "failed",
        progress: 100,
        errorMessage: MESSAGES.dummy_simulated_fail,
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
    const progress = Math.min(99, Math.floor((ms / total) * 100));
    return {
      status: "processing",
      progress,
      ...dummyLive(progress, "processing"),
      providerTaskId: job.providerTaskId,
    };
  }

  const progress = Math.min(20, Math.floor((ms / total) * 100));
  return {
    status: "queued",
    progress,
    ...dummyLive(progress, "queued"),
    providerTaskId: job.providerTaskId,
  };
}

/**
 * Local product provider: queued → processing → ready/failed from createdAt.
 * No paid API. Output is the demo cube GLB until a real provider is wired.
 */
export const dummyProvider: ReconstructionProvider = {
  name: "dummy",

  async createTask(input: CreateTaskInput) {
    return { providerTaskId: `dummy-${input.jobId}` };
  },

  async getTask(job: Job): Promise<GetTaskResult> {
    return getDummyTask(job);
  },
};
