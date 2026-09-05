import { NextResponse } from "next/server";

/** Stub: list / create jobs — Week1 returns 200 OK only */
export async function GET() {
  return NextResponse.json({ ok: true, jobs: [] }, { status: 200 });
}

export async function POST() {
  return NextResponse.json(
    { ok: true, message: "stub — reconstruction API in week 2" },
    { status: 200 },
  );
}
