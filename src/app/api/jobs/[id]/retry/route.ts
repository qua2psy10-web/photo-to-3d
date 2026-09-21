import { NextResponse } from "next/server";
import { retryJob } from "@/lib/jobs-store";
import { ErrorCode, MESSAGES, UserFacingError } from "@/lib/messages";
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
        {
          ok: false,
          error: ErrorCode.not_found,
          message: MESSAGES.not_found,
          id,
        },
        { status: 404 },
      );
    }
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
    return NextResponse.json(
      {
        ok: false,
        error: ErrorCode.retry_failed,
        message: err instanceof Error ? err.message : MESSAGES.retry_failed,
      },
      { status: 400 },
    );
  }
}
