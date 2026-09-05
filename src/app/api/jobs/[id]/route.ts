import { NextResponse } from "next/server";
import { getJob, jobProgressPercent } from "@/lib/jobs-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toPublicJob(job: NonNullable<ReturnType<typeof getJob>>) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    imageCount: job.imageCount,
    ...(job.modelUrl ? { modelUrl: job.modelUrl } : {}),
  };
}

/** GET job by id — advances fake progress on read from createdAt. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const job = getJob(id);

  if (!job) {
    return NextResponse.json(
      { ok: false, error: "not_found", id },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      ...toPublicJob(job),
      progress: jobProgressPercent(job),
    },
    { status: 200 },
  );
}
