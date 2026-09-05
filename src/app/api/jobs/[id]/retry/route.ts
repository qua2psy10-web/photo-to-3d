import { NextResponse } from "next/server";
import { retryJob } from "@/lib/jobs-store";
import { toPublicJob } from "@/lib/public-job";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const job = await retryJob(id);
    if (!job) {
      return NextResponse.json(
        { ok: false, error: "not_found", id },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: true, ...toPublicJob(job), id: job.id },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "retry_failed",
        message: err instanceof Error ? err.message : "retry failed",
      },
      { status: 400 },
    );
  }
}
