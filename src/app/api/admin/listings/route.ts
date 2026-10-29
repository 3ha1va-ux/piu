import { NextResponse } from "next/server";
import { petListings } from "@/data/listings-data";
import type { PetListing, ListingTone, AnimalType } from "@/data/listings-types";
import { isAuthenticatedServer } from "@/lib/adminAuth";
import {
  readUserListings,
  deleteUserListing,
  updateUserListing,
} from "@/lib/userListingsStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const isAuth = await isAuthenticatedServer();
  if (!isAuth) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(searchParams.get("limit") || "25", 10)));
  const source = searchParams.get("source") || "all"; // all | user | demo
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const tone = searchParams.get("tone") as ListingTone | null;
  const animal = searchParams.get("animal") as AnimalType | null;

  const userItems = await readUserListings();
  const demoItems = petListings;

  type EnrichedListing = PetListing & { isUserSubmitted: boolean };

  let combined: EnrichedListing[] = [];

  if (source === "user") {
    combined = userItems.map((item) => ({ ...item, isUserSubmitted: true }));
  } else if (source === "demo") {
    combined = demoItems.map((item) => ({ ...item, isUserSubmitted: false }));
  } else {
    // User items first, then demo items
    combined = [
      ...userItems.map((item) => ({ ...item, isUserSubmitted: true })),
      ...demoItems.map((item) => ({ ...item, isUserSubmitted: false })),
    ];
  }

  // Filter
  if (tone) {
    combined = combined.filter((item) => item.tone === tone);
  }
  if (animal) {
    combined = combined.filter((item) => item.animal === animal);
  }
  if (q) {
    combined = combined.filter((item) => {
      const matchName = item.name?.toLowerCase().includes(q);
      const matchPlace = item.place?.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      const matchPhone = item.contactPhone?.toLowerCase().includes(q);
      const matchBreed = item.breed?.toLowerCase().includes(q);
      return matchName || matchPlace || matchId || matchPhone || matchBreed;
    });
  }

  const total = combined.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const items = combined.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    counts: {
      totalAll: userItems.length + demoItems.length,
      userCount: userItems.length,
      demoCount: demoItems.length,
    },
  });
}

export async function DELETE(request: Request) {
  const isAuth = await isAuthenticatedServer();
  if (!isAuth) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID მითითებული არ არის" }, { status: 400 });
    }

    // Check if it's a demo listing
    if (!id.startsWith("u-")) {
      const isDemo = petListings.some((item) => item.id === id);
      if (isDemo) {
        return NextResponse.json(
          { error: "დემო მონაცემების წაშლა დაბლოკილია" },
          { status: 400 }
        );
      }
    }

    const success = await deleteUserListing(id);
    if (!success) {
      return NextResponse.json(
        { error: "განცხადება ვერ მოიძებნა ან უკვე წაშლილია" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, message: "განცხადება წაიშალა" });
  } catch {
    return NextResponse.json(
      { error: "შეცდომა განცხადების წაშლისას" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const isAuth = await isAuthenticatedServer();
  if (!isAuth) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates } = body ?? {};
    if (!id || !updates) {
      return NextResponse.json(
        { error: "ID და ცვლილებები სავალდებულოა" },
        { status: 400 }
      );
    }

    if (!id.startsWith("u-")) {
      return NextResponse.json(
        { error: "დემო მონაცემების რედაქტირება დაბლოკილია" },
        { status: 400 }
      );
    }

    const updated = await updateUserListing(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: "განცხადება ვერ მოიძებნა" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, listing: updated });
  } catch {
    return NextResponse.json(
      { error: "შეცდომა განცხადების რედაქტირებისას" },
      { status: 500 }
    );
  }
}
