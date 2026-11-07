import { NextResponse } from "next/server";
import { isAuthenticatedServer } from "@/lib/adminAuth";
import { getTelemetrySummary } from "@/lib/telemetryStore";

export const runtime = "nodejs";

export async function GET() {
  const isAuth = await isAuthenticatedServer();
  if (!isAuth) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const summary = getTelemetrySummary();
    return NextResponse.json({ ok: true, summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
