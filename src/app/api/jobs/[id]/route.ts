import { NextResponse } from "next/server";
import { getJob, jobProgressPercent } from "@/lib/jobs-store";
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
      { ok: false, error: "not_found", id },
      { status: 404 },
    );
  }

  const progress = await jobProgressPercent(job);

  return NextResponse.json(
    {
      ok: true,
      ...toPublicJob(job),
      progress,
    },
    { status: 200 },
  );
}
