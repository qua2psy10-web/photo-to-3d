import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Job } from "@/lib/types";
import { listJobs, saveJob } from "@/lib/jobs-store";

function toPublicJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    imageCount: job.imageCount,
    ...(job.modelUrl ? { modelUrl: job.modelUrl } : {}),
  };
}

export async function GET() {
  return NextResponse.json(
    { jobs: listJobs().map(toPublicJob) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  let imageCount = 0;
  try {
    const body = (await request.json()) as { imageCount?: unknown };
    if (typeof body.imageCount === "number" && Number.isFinite(body.imageCount)) {
      imageCount = Math.max(0, Math.floor(body.imageCount));
    }
  } catch {
    // empty / invalid body — imageCount stays 0
  }

  // Soft random fail ~5% so failed UI can be exercised in Week1.
  const simulateFail = Math.random() < 0.05;

  const job: Job = {
    id: randomUUID(),
    status: "queued",
    createdAt: new Date().toISOString(),
    imageCount,
    ...(simulateFail ? { simulateFail: true } : {}),
  };

  saveJob(job);

  return NextResponse.json({ ...toPublicJob(job), id: job.id }, { status: 201 });
}
