import { NextResponse } from "next/server";
import { incrementListingViews } from "@/lib/userListingsStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const { id } = body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid listing id" }, { status: 400 });
    }

    const views = await incrementListingViews(id);
    return NextResponse.json({ ok: true, views });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
