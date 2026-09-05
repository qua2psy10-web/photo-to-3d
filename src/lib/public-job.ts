import type { Job } from "@/lib/types";

export function toPublicJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    imageCount: job.imageCount,
    imagePaths: job.imagePaths,
    thumbnailUrl:
      job.imagePaths.length > 0
        ? `/api/jobs/${job.id}/images/0`
        : undefined,
    ...(job.modelUrl ? { modelUrl: job.modelUrl } : {}),
    ...(job.errorMessage ? { errorMessage: job.errorMessage } : {}),
    ...(job.provider ? { provider: job.provider } : {}),
  };
}
