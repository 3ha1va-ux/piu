import { NextResponse } from "next/server";
import { isAuthenticatedServer } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await isAuthenticatedServer();
  return NextResponse.json({ authenticated });
}
