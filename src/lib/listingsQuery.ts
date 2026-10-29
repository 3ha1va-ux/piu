import "server-only";

import { petListings } from "@/data/listings-data";
import type {
  AnimalType,
  ListingTone,
  ListingsQueryResult,
  MapBBox,
  PetListing,
  ServerCluster,
  ToneCounts,
} from "@/data/listings-types";
import { withDemoPhotosList } from "@/lib/demoPhotos";
import { readUserListings } from "@/lib/userListingsStore";

const emptyTones = (): ToneCounts => ({ lost: 0, gift: 0, found: 0 });

function inBBox(item: PetListing, bbox: MapBBox): boolean {
  return (
    item.lng >= bbox.west &&
    item.lng <= bbox.east &&
    item.lat >= bbox.south &&
    item.lat <= bbox.north
  );
}

function cellSizeForZoom(zoom: number): number {
  if (zoom < 7) return 0.55;
  if (zoom < 8) return 0.35;
  if (zoom < 9) return 0.22;
  if (zoom < 10) return 0.12;
  return 0.06;
}

function buildGridClusters(
  matched: PetListing[],
  zoom: number,
): ServerCluster[] {
  const size = cellSizeForZoom(zoom);
  const map = new Map<
    string,
    { latSum: number; lngSum: number; count: number; tones: ToneCounts }
  >();

  for (const item of matched) {
    const gx = Math.floor(item.lng / size);
    const gy = Math.floor(item.lat / size);
    const key = `${gx}:${gy}`;
    let cell = map.get(key);
    if (!cell) {
      cell = { latSum: 0, lngSum: 0, count: 0, tones: emptyTones() };
      map.set(key, cell);
    }
    cell.latSum += item.lat;
    cell.lngSum += item.lng;
    cell.count += 1;
    cell.tones[item.tone] += 1;
  }

  const raw: ServerCluster[] = [];
  let i = 0;
  for (const cell of map.values()) {
    raw.push({
      id: `g-${i++}`,
      lat: cell.latSum / cell.count,
      lng: cell.lngSum / cell.count,
      count: cell.count,
      tones: cell.tones,
    });
  }
  // Merge centroids that would sit on top of each other at this zoom
  // (adjacent grid cells near a boundary).
  return mergeCloseClusters(raw, size * 0.55);
}

/** Greedy merge of server clusters whose centers are closer than minDist. */
function mergeCloseClusters(
  clusters: ServerCluster[],
  minDist: number,
): ServerCluster[] {
  if (clusters.length <= 1) return clusters;
  const remaining = [...clusters];
  const merged: ServerCluster[] = [];
  let seq = 0;

  while (remaining.length > 0) {
    const base = remaining.shift()!;
    let latSum = base.lat * base.count;
    let lngSum = base.lng * base.count;
    let count = base.count;
    const tones = { ...base.tones };

    for (let i = remaining.length - 1; i >= 0; i--) {
      const other = remaining[i]!;
      const dLat = base.lat - other.lat;
      const dLng = base.lng - other.lng;
      if (dLat * dLat + dLng * dLng > minDist * minDist) continue;
      latSum += other.lat * other.count;
      lngSum += other.lng * other.count;
      count += other.count;
      tones.lost += other.tones.lost;
      tones.gift += other.tones.gift;
      tones.found += other.tones.found;
      remaining.splice(i, 1);
    }

    merged.push({
      id: `g-${seq++}`,
      lat: latSum / count,
      lng: lngSum / count,
      count,
      tones,
    });
  }
  return merged;
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
  const { bbox, zoom, tones, animals } = params;

  const userListings = await readUserListings();
  const userMatched = userListings.filter((item) =>
    matchesFilters(item, tones, animals, bbox),
  );
  const demoMatched = petListings.filter((item) =>
    matchesFilters(item, tones, animals, bbox),
  );
  const matched = [...userMatched, ...demoMatched];
  const totalMatched = matched.length;

  if (zoom < 10) {
    return {
      totalMatched,
      mode: "grid",
      items: [],
      clusters: buildGridClusters(matched, zoom),
    };
  }

  return {
    totalMatched,
    mode: "points",
    items: withDemoPhotosList(matched),
    clusters: [],
  };
}
