import "server-only";

import { petListings } from "@/data/listings-data";
import type {
  AnimalType,
  ListingSort,
  ListingTone,
  PetListing,
} from "@/data/listings-types";
import { withDemoPhotosList } from "@/lib/demoPhotos";
import { readUserListings } from "@/lib/userListingsStore";

export type { ListingSort };

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function digitsOnly(text: string): string {
  return text.replace(/\D/g, "");
}

function eventDateKey(item: PetListing): string {
  return item.eventDate?.slice(0, 10) ?? "";
}

function createdAtKey(item: PetListing): string {
  return item.createdAt ?? "";
}

/** Used for period filter: prefer event date, else upload date */
function filterDateKey(item: PetListing): string | null {
  if (item.eventDate) return item.eventDate.slice(0, 10);
  if (item.createdAt) return item.createdAt.slice(0, 10);
  return null;
}

function matchesQuery(item: PetListing, q: string): boolean {
  if (!q) return true;
  if (normalize(item.id) === q) return true;

  const phoneDigits = digitsOnly(item.contactPhone ?? "");
  const queryDigits = digitsOnly(q);
  if (queryDigits.length >= 3 && phoneDigits.includes(queryDigits)) {
    return true;
  }

  const hay = normalize(
    [
      item.name,
      item.place,
      item.kind,
      item.animal,
      item.description ?? "",
      item.breed ?? "",
      item.color ?? "",
      item.age ?? "",
      item.sex ?? "",
      item.reward ?? "",
      item.contactName ?? "",
      item.contactPhone ?? "",
      item.contactSocial ?? "",
      item.eventDate ?? "",
      item.createdAt ?? "",
    ].join(" "),
  );

  return q.split(/\s+/).filter(Boolean).every((token) => hay.includes(token));
}

function matchesDateRange(
  item: PetListing,
  dateFrom?: string,
  dateTo?: string,
): boolean {
  if (!dateFrom && !dateTo) return true;
  const d = filterDateKey(item);
  if (!d) return false;
  if (dateFrom && d < dateFrom) return false;
  if (dateTo && d > dateTo) return false;
  return true;
}

function compareNullable(a: string, b: string, dir: "asc" | "desc"): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const cmp = a.localeCompare(b);
  return dir === "asc" ? cmp : -cmp;
}

function sortListings(items: PetListing[], sort: ListingSort): PetListing[] {
  const copy = [...items];
  copy.sort((a, b) => {
    if (sort === "created_desc" || sort === "created_asc") {
      return compareNullable(
        createdAtKey(a),
        createdAtKey(b),
        sort === "created_asc" ? "asc" : "desc",
      );
    }
    return compareNullable(
      eventDateKey(a),
      eventDateKey(b),
      sort === "event_asc" ? "asc" : "desc",
    );
  });
  return copy;
}

export async function searchListings(params: {
  q: string;
  tones?: ListingTone[];
  animals?: AnimalType[];
  dateFrom?: string;
  dateTo?: string;
  sort?: ListingSort;
  limit?: number;
}): Promise<{ total: number; items: PetListing[] }> {
  const q = normalize(params.q);
  const limit = Math.min(Math.max(params.limit ?? 40, 1), 80);
  const tones = params.tones ?? [];
  const animals = params.animals ?? [];
  const dateFrom = params.dateFrom?.slice(0, 10) || undefined;
  const dateTo = params.dateTo?.slice(0, 10) || undefined;
  const sort: ListingSort = params.sort ?? "created_desc";

  const pool = [...(await readUserListings()), ...petListings];
  const matched = pool.filter((item) => {
    if (tones.length > 0 && !tones.includes(item.tone)) return false;
    if (animals.length > 0 && !animals.includes(item.animal)) return false;
    if (!matchesDateRange(item, dateFrom, dateTo)) return false;
    return matchesQuery(item, q);
  });

  const sorted = sortListings(matched, sort);

  return {
    total: sorted.length,
    items: withDemoPhotosList(sorted.slice(0, limit)),
  };
}
