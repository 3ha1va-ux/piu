import { NextResponse } from "next/server";
import type {
  AnimalType,
  ListingSort,
  ListingTone,
} from "@/data/listings-types";
import { LISTING_SORTS } from "@/data/listings-types";
import { searchListings } from "@/lib/listingsSearch";

export const runtime = "nodejs";

function parseList<T extends string>(raw: string | null, allowed: T[]): T[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((p): p is T => allowed.includes(p as T));
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseSort(raw: string | null): ListingSort {
  if (raw && LISTING_SORTS.includes(raw as ListingSort)) {
    return raw as ListingSort;
  }
  return "created_desc";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const tones = parseList<ListingTone>(searchParams.get("tones"), [
    "lost",
    "gift",
    "found",
  ]);
  const animals = parseList<AnimalType>(searchParams.get("animals"), [
    "ძაღლი",
    "კატა",
  ]);
  const dateFromRaw = (searchParams.get("dateFrom") ?? "").trim();
  const dateToRaw = (searchParams.get("dateTo") ?? "").trim();
  const dateFrom = isDate(dateFromRaw) ? dateFromRaw : undefined;
  const dateTo = isDate(dateToRaw) ? dateToRaw : undefined;
  const sort = parseSort(searchParams.get("sort"));

  const hasQuery = q.length >= 2 || q.replace(/\D/g, "").length >= 3;
  const hasFilter =
    tones.length > 0 || animals.length > 0 || Boolean(dateFrom || dateTo);

  if (!hasQuery && !hasFilter) {
    return NextResponse.json({ total: 0, items: [] });
  }

  const result = await searchListings({
    q,
    tones,
    animals,
    dateFrom,
    dateTo,
    sort,
    limit: 40,
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "no-store" },
  });
}
