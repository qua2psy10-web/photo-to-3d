import { NextResponse } from "next/server";
import { getJob, jobProgressView } from "@/lib/jobs-store";
import { ErrorCode, MESSAGES } from "@/lib/messages";
import { toPublicJob } from "@/lib/public-job";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const job = await getJob(id);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: ErrorCode.not_found, message: MESSAGES.not_found, id },
      { status: 404 },
    );
  }

  const live = await jobProgressView(job);

  return NextResponse.json(
    {
      ok: true,
      ...toPublicJob(job),
      progress: live.progress,
      ...(live.stage ? { stage: live.stage } : {}),
      ...(live.activity ? { activity: live.activity } : {}),
      ...(live.log ? { log: live.log } : {}),
    },
    { status: 200 },
  );
}
