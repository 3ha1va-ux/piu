import { NextResponse } from "next/server";
import { recordVisitorSession } from "@/lib/telemetryStore";

export const runtime = "nodejs";

function parseUserAgent(ua: string) {
  let browser = "სხვა";
  let os = "სხვა";

  // Detect OS
  if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/android/i.test(ua)) os = "Android";
  else if (/windows nt/i.test(ua)) os = "Windows";
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";

  // Detect Browser
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\/|opera/i.test(ua)) browser = "Opera";
  else if (/brave/i.test(ua)) browser = "Brave";
  else if (/chrome|crios/i.test(ua)) browser = "Chrome";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";

  return { browser, os };
}

export async function POST(request: Request) {
  try {
    const rawIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    const ua = request.headers.get("user-agent") || "";
    const { browser: uaBrowser, os: uaOs } = parseUserAgent(ua);

    let body: Record<string, unknown> = {};
    try {
      const parsed: unknown = await request.json();
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      // Beacon or raw text
    }

    const deviceType: "mobile" | "desktop" | "tablet" =
      body.deviceType === "mobile" || body.deviceType === "tablet" || body.deviceType === "desktop"
        ? body.deviceType
        : /mobile|android|iphone/i.test(ua)
        ? "mobile"
        : "desktop";

    const asString = (val: unknown, fallback: string): string =>
      typeof val === "string" && val.trim() ? val : fallback;

    const session = recordVisitorSession({
      ip: rawIp,
      deviceType,
      screenResolution: asString(body.screenResolution, "უცნობი"),
      viewport: asString(body.viewport, "უცნობი"),
      browser: asString(body.browser, uaBrowser),
      os: asString(body.os, uaOs),
      language: asString(body.language, "ka"),
      batteryLevel: typeof body.batteryLevel === "number" ? body.batteryLevel : null,
      batteryCharging: typeof body.batteryCharging === "boolean" ? body.batteryCharging : null,
      batteryProtected: Boolean(body.batteryProtected),
      page: asString(body.page, "/"),
      referrer: asString(body.referrer, "direct"),
      connectionType:
        typeof body.connectionType === "string" && body.connectionType.trim()
          ? body.connectionType
          : undefined,
    });

    return NextResponse.json({ ok: true, id: session.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
