import { NextResponse } from "next/server";
import { petListings } from "@/data/listings-data";
import { withDemoPhotos } from "@/lib/demoPhotos";
import { readUserListings } from "@/lib/userListingsStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const users = await readUserListings();
  const listing =
    users.find((item) => item.id === id) ??
    petListings.find((item) => item.id === id) ??
    null;

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    { listing: withDemoPhotos(listing) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
