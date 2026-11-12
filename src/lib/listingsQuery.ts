import "server-only";

import { petListings } from "@/data/listings-data";
import type {
  AnimalType,
  ListingTone,
  ListingsQueryResult,
  MapBBox,
  PetListing,
} from "@/data/listings-types";
import { withDemoPhotosList } from "@/lib/demoPhotos";
import { readUserListings } from "@/lib/userListingsStore";

function inBBox(item: PetListing, bbox: MapBBox): boolean {
  return (
    item.lng >= bbox.west &&
    item.lng <= bbox.east &&
    item.lat >= bbox.south &&
    item.lat <= bbox.north
  );
}

function matchesFilters(
  item: PetListing,
  tones: ListingTone[],
  animals: AnimalType[],
  bbox: MapBBox,
): boolean {
  if (tones.length > 0 && !tones.includes(item.tone)) return false;
  if (animals.length > 0 && !animals.includes(item.animal)) return false;
  return inBBox(item, bbox);
}

export async function queryListings(params: {
  bbox: MapBBox;
  zoom: number;
  tones: ListingTone[];
  animals: AnimalType[];
}): Promise<ListingsQueryResult> {
  const { bbox, tones, animals } = params;

  const userListings = await readUserListings();
  const userMatched = userListings.filter((item) =>
    matchesFilters(item, tones, animals, bbox),
  );
  const demoMatched = petListings.filter((item) =>
    matchesFilters(item, tones, animals, bbox),
  );
  const matched = [...userMatched, ...demoMatched];
  const totalMatched = matched.length;
  return {
    totalMatched,
    mode: "points",
    items: withDemoPhotosList(matched),
    clusters: [],
  };
}
