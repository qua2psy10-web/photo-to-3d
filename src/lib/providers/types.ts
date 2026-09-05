import type { Job, JobStatus } from "@/lib/types";

/** Input for starting a reconstruction task. */
export type CreateTaskInput = {
  jobId: string;
  /** Absolute or project-relative filesystem paths to uploaded images. */
  imagePaths: string[];
  /** Soft-fail hint for dummy provider only. */
  simulateFail?: boolean;
  createdAt: string;
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
  /** Set when ready — for dummy this is `/samples/demo.glb`. */
  modelUrl?: string;
  /** Human-readable failure reason (provider-agnostic copy OK). */
  errorMessage?: string;
  providerTaskId?: string;
};

/**
 * Reconstruction provider plug-in.
 * Week2 vessel: `dummy` works locally; `tripo` is a stub for later.
 */
export interface ReconstructionProvider {
  readonly name: string;
  createTask(input: CreateTaskInput): Promise<{ providerTaskId?: string }>;
  getTask(job: Job): Promise<GetTaskResult>;
}

export function mapProviderStatusToJob(status: ProviderTaskStatus): JobStatus {
  return status;
}
