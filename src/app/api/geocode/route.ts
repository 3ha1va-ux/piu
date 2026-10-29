import { NextResponse } from "next/server";
import { searchLocalPlaces } from "@/data/georgiaPlaces";

export const runtime = "nodejs";

export type GeocodeHit = {
  label: string;
  place: string;
  lat: number;
  lng: number;
  zoom: number;
  /** [west, south, east, north] when known */
  bbox?: [number, number, number, number];
  source: "local" | "osm";
};

type NominatimItem = {
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  type?: string;
  class?: string;
  boundingbox?: [string, string, string, string];
  address?: {
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
  };
};

function formatPlace(item: NominatimItem): string {
  const a = item.address ?? {};
  const district =
    a.suburb || a.neighbourhood || a.village || a.town || item.name || "";
  const city = a.city || a.town || a.county || a.state || "საქართველო";
  if (district && city && district !== city) return `${city} · ${district}`;
  return district || city || item.display_name || "საქართველო";
}

function zoomFromBBox(bbox: [number, number, number, number]): number {
  const [west, south, east, north] = bbox;
  const latSpan = Math.abs(north - south);
  const lngSpan = Math.abs(east - west);
  const span = Math.max(latSpan, lngSpan);
  if (span > 0.45) return 11;
  if (span > 0.2) return 12;
  if (span > 0.08) return 13;
  if (span > 0.04) return 14;
  if (span > 0.02) return 15;
  return 16;
}

function zoomFromOsmType(item: NominatimItem): number {
  const t = `${item.class ?? ""}:${item.type ?? ""}`;
  if (t.includes("city") || t.includes("state")) return 12;
  if (t.includes("town") || t.includes("municipality")) return 13;
  if (t.includes("suburb") || t.includes("neighbourhood") || t.includes("quarter"))
    return 14.5;
  if (t.includes("village") || t.includes("hamlet")) return 14;
  if (t.includes("residential") || t.includes("pedestrian")) return 16;
  return 14;
}

function parseBBox(
  raw?: [string, string, string, string],
): [number, number, number, number] | undefined {
  if (!raw || raw.length !== 4) return undefined;
  // Nominatim: [south, north, west, east]
  const south = Number(raw[0]);
  const north = Number(raw[1]);
  const west = Number(raw[2]);
  const east = Number(raw[3]);
  if (![south, north, west, east].every(Number.isFinite)) return undefined;
  return [west, south, east, north];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] as GeocodeHit[] });
  }

  const local = searchLocalPlaces(q, 8).map(
    (p): GeocodeHit => ({
      label: p.label,
      place: p.place,
      lat: p.lat,
      lng: p.lng,
      zoom: p.zoom,
      bbox: p.bbox,
      source: "local",
    }),
  );

  const results: GeocodeHit[] = [...local];
  const seen = new Set(local.map((p) => `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}`));

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", `${q}, Georgia`);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "ge");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "IpovePetMap/1.0 (local-dev; contact@ipove.local)",
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = (await res.json()) as NominatimItem[];
      for (const item of data) {
        const lat = Number(item.lat);
        const lng = Number(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
        if (lat < 40.6 || lat > 43.9 || lng < 39.2 || lng > 47.2) continue;
        const key = `${lat.toFixed(3)}:${lng.toFixed(3)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const place = formatPlace(item);
        const bbox = parseBBox(item.boundingbox);
        const zoom = bbox ? zoomFromBBox(bbox) : zoomFromOsmType(item);
        results.push({
          label: item.name || place,
          place,
          lat,
          lng,
          zoom,
          bbox,
          source: "osm",
        });
      }
    }
  } catch {
    /* local suggestions still returned */
  }

  return NextResponse.json({ results: results.slice(0, 10) });
}
