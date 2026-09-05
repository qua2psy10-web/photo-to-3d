import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Stub: get job by id — Week1 returns 200 OK only */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return NextResponse.json(
    {
      ok: true,
      id,
      status: "pending",
      message: "stub — reconstruction API in week 2",
    },
    { status: 200 },
  );
}
