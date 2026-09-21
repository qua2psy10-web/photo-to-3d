import { NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";
import { MESSAGES } from "@/lib/messages";
import { readLocalGlb } from "@/lib/model-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json(
      { ok: false, error: "not_found", message: MESSAGES.not_found, id },
      { status: 404 },
    );
  }

  if (job.status !== "ready" && job.status !== "completed") {
    return NextResponse.json(
      {
        ok: false,
        error: "not_ready",
        message: "モデルはまだ準備できていません。",
        id,
        status: job.status,
      },
      { status: 409 },
    );
  }

  const { buffer } = readLocalGlb(id);
  if (buffer.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "model_missing",
        message: "GLB ファイルを読み込めませんでした。",
      },
      { status: 404 },
    );
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "model/gltf-binary",
      "Content-Disposition": `inline; filename="${id}.glb"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
