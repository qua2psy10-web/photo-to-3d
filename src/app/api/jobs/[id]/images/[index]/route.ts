import { NextResponse } from "next/server";
import fs from "fs";
import { absoluteImagePath, getJob, getJobImages } from "@/lib/jobs-store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; index: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id, index } = await context.params;
  const job = await getJob(id);
  if (!job) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const idx = Number.parseInt(index, 10);
  if (!Number.isFinite(idx) || idx < 0) {
    return NextResponse.json({ ok: false, error: "bad_index" }, { status: 400 });
  }

  const images = await getJobImages(id);
  const image = images[idx];
  if (!image) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  try {
    const abs = absoluteImagePath(image.path);
    const buf = fs.readFileSync(abs);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": image.mimeType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 404 });
  }
}
