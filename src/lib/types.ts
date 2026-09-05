export type JobStatus =
  | "queued"
  | "pending"
  | "uploading"
  | "processing"
  | "ready"
  | "completed"
  | "failed";

export type Job = {
  id: string;
  status: JobStatus;
  createdAt: string;
  imageCount: number;
  modelUrl?: string;
  /** Soft-fail flag set ~5% on create (Week1 fake progress). */
  simulateFail?: boolean;
};

/** Fake timeline (ms since createdAt) for deterministic advance-on-read. */
export const FAKE_PROGRESS = {
  queuedUntilMs: 3_000,
  processingUntilMs: 12_000,
  /** Within processing: analyzing → meshing split */
  analyzingUntilMs: 7_500,
} as const;
