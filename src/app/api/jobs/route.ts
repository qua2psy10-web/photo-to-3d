import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Job } from "@/lib/types";
import { listJobs, saveJob } from "@/lib/jobs-store";

export async function GET() {
  return NextResponse.json({ jobs: listJobs() }, { status: 200 });
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

  const job: Job = {
    id: randomUUID(),
    status: "queued",
    createdAt: new Date().toISOString(),
    imageCount,
  };

  saveJob(job);

  return NextResponse.json({ ...job, id: job.id }, { status: 201 });
}
