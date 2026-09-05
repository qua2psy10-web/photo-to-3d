export type JobStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed";

export type Job = {
  id: string;
  status: JobStatus;
  createdAt: string;
  imageCount: number;
  modelUrl?: string;
};
