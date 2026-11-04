import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const steps: Record<string, string> = {};

  try {
    steps["1_start"] = "ok";
  } catch (e: any) {
    steps["1_start"] = e?.message;
  }

  try {
    const types = await import("@/data/listings-types");
    steps["2_listings_types"] = types ? "ok" : "empty";
  } catch (e: any) {
    steps["2_listings_types"] = e?.message || String(e);
  }

  try {
    const data = await import("@/data/listings-data");
    steps["3_listings_data"] = `count_${data.petListings?.length}`;
  } catch (e: any) {
    steps["3_listings_data"] = e?.message || String(e);
  }

  try {
    const demo = await import("@/lib/demoPhotos");
    steps["4_demo_photos"] = demo ? "ok" : "empty";
  } catch (e: any) {
    steps["4_demo_photos"] = e?.message || String(e);
  }

  try {
    const sup = await import("@/lib/supabase");
    steps["5_supabase"] = sup?.supabase ? "ok" : "empty";
  } catch (e: any) {
    steps["5_supabase"] = e?.message || String(e);
  }

  try {
    const media = await import("@/lib/mediaStorage");
    steps["6_mediaStorage"] = media ? "ok" : "empty";
  } catch (e: any) {
    steps["6_mediaStorage"] = e?.message || String(e);
  }

  try {
    const userStore = await import("@/lib/userListingsStore");
    steps["7_userListingsStore"] = userStore ? "ok" : "empty";
  } catch (e: any) {
    steps["7_userListingsStore"] = e?.message || String(e);
  }

  try {
    const query = await import("@/lib/listingsQuery");
    steps["8_listingsQuery"] = query ? "ok" : "empty";
  } catch (e: any) {
    steps["8_listingsQuery"] = e?.message || String(e);
  }

  return NextResponse.json({ ok: true, steps });
}
