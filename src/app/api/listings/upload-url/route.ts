import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const BUCKET = "pet-media";
const MAX_VIDEO_BYTES = 40_000_000;
const ALLOWED_VIDEO_EXTS = new Set(["mp4", "mov", "webm", "m4v"]);

function extractExtension(fileName: string, mimeType: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  if (ALLOWED_VIDEO_EXTS.has(fromName)) return fromName;
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("quicktime")) return "mov";
  return "mp4";
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) {
      return NextResponse.json(
        { error: "ავტორიზაცია აუცილებელია." },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: "სესია ვადაგასულია. გთხოვთ თავიდან შეხვიდეთ." },
        { status: 401 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      fileName?: unknown;
      mimeType?: unknown;
      sizeBytes?: unknown;
    } | null;

    const fileName = typeof body?.fileName === "string" ? body.fileName : "video.mp4";
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
    const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : 0;

    if (!mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "დასაშვებია მხოლოდ ვიდეო ფაილი (MP4, MOV, WEBM)." },
        { status: 400 },
      );
    }

    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "ვიდეო მაქსიმუმ 40MB უნდა იყოს." },
        { status: 400 },
      );
    }

    const ext = extractExtension(fileName, mimeType);
    const objectPath = `videos/${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(objectPath);

    if (error || !data?.signedUrl) {
      return NextResponse.json(
        { error: "ვიდეოს ატვირთვის ბმული ვერ შეიქმნა." },
        { status: 503 },
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectPath);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: objectPath,
      publicUrl,
    });
  } catch (err) {
    console.error("Failed to create upload URL:", err);
    return NextResponse.json(
      { error: "სერვერის შეცდომა ატვირთვის მომზადებისას." },
      { status: 500 },
    );
  }
}
