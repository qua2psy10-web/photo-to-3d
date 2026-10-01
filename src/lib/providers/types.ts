import type { CaptureDetail } from "@/lib/photogrammetry/detail";
import type { Job, JobStatus } from "@/lib/types";

/** Input for starting a reconstruction task. */
export type CreateTaskInput = {
  jobId: string;
  /** Absolute or project-relative filesystem paths to uploaded images. */
  imagePaths: string[];
  /** Soft-fail hint for dummy provider only. */
  simulateFail?: boolean;
  createdAt: string;
  /** Mesh detail for local Object Capture. */
  detail?: CaptureDetail;
};

export type ProviderTaskStatus =
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export type GetTaskResult = {
  status: ProviderTaskStatus;
  /** 0–100 */
  progress: number;
  /** Capture phase key. See `CaptureStage`. */
  stage?: string;
  /** Current Japanese activity sentence. */
  activity?: string;
  /** Recent Japanese activity sentences. */
  log?: string[];
  /** Set when ready — for dummy this is `/samples/demo.glb`. */
  modelUrl?: string;
  /** Human-readable failure reason (provider-agnostic copy OK). */
  errorMessage?: string;
  providerTaskId?: string;
};

/**
 * Reconstruction provider plug-in.
 * Product slice: `dummy` is the live provider. `tripo` stays an unconfigured stub.
 */
export interface ReconstructionProvider {
  readonly name: string;
  createTask(input: CreateTaskInput): Promise<{ providerTaskId?: string }>;
  getTask(job: Job): Promise<GetTaskResult>;
}

export function mapProviderStatusToJob(status: ProviderTaskStatus): JobStatus {
  return status;
}
