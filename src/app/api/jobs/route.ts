import { NextResponse } from "next/server";
import { createJob, listJobs } from "@/lib/jobs-store";
import { ErrorCode, MESSAGES, UserFacingError } from "@/lib/messages";
import { toPublicJob } from "@/lib/public-job";

export const runtime = "nodejs";

export async function GET() {
  const jobs = await listJobs();
  return NextResponse.json(
    { jobs: jobs.map(toPublicJob) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCode.expected_multipart,
          message: MESSAGES.expected_multipart,
        },
        { status: 400 },
      );
    }

    const form = await request.formData();
    const entries = form.getAll("images");
    const files: {
      buffer: Buffer;
      originalName: string;
      mimeType: string;
    }[] = [];

    for (const entry of entries) {
      if (typeof entry === "string") continue;
      const file = entry as File;
      const ab = await file.arrayBuffer();
      files.push({
        buffer: Buffer.from(ab),
        originalName: file.name || "upload.bin",
        mimeType: file.type || "application/octet-stream",
      });
    }

    if (files.length < 1) {
      return NextResponse.json(
        {
          ok: false,
          error: ErrorCode.no_images,
          message: MESSAGES.no_images,
        },
        { status: 400 },
      );
    }

    const job = await createJob({ files });
    return NextResponse.json(
      { ok: true, ...toPublicJob(job), id: job.id },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof UserFacingError) {
      return NextResponse.json(
        { ok: false, error: err.code, message: err.message },
        { status: err.status },
      );
    }
    console.error("[POST /api/jobs]", err);
    return NextResponse.json(
      {
        ok: false,
        error: ErrorCode.create_failed,
        message:
          err instanceof Error ? err.message : MESSAGES.create_failed,
      },
      { status: 500 },
    );
  }
}
