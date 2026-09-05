export type JobStatus =
  | "queued"
  | "pending"
  | "uploading"
  | "processing"
  | "ready"
  | "completed"
  | "failed";

export type JobImage = {
  id: string;
  jobId: string;
  path: string;
  originalName: string;
  mimeType: string;
  size: number;
  sortOrder: number;
};

export type Job = {
  id: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  imageCount: number;
  /** Relative paths under data/ (or public URL once ready). */
  imagePaths: string[];
  modelUrl?: string;
  /** Provider-agnostic failure message for UI. */
  errorMessage?: string;
  /** Soft-fail flag for dummy provider (~5% on create). */
  simulateFail?: boolean;
  /** External provider task id when wired (Tripo etc.). */
  providerTaskId?: string;
  provider?: string;
};

/** Fake timeline (ms since createdAt) for deterministic advance-on-read. */
export const FAKE_PROGRESS = {
  queuedUntilMs: 3_000,
  processingUntilMs: 12_000,
  /** Within processing: analyzing → meshing split */
  analyzingUntilMs: 7_500,
} as const;

export const DEMO_MODEL_URL = "/samples/demo.glb";
