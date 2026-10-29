import { GEORGIA_CENTER, GEORGIA_ZOOM } from "@/data/listings-types";

/** Bump when default view changes so stale browser saves don't override. */
const STORAGE_KEY = "ipove.georgiaView.v3";

/** Fixed camera: same zoom on every screen → Georgia looks the same size. */
export type MapView = {
  center: [number, number];
  zoom: number;
};

export function isValidMapView(value: unknown): value is MapView {
  if (!value || typeof value !== "object") return false;
  const v = value as MapView;
  if (!Array.isArray(v.center) || v.center.length !== 2) return false;
  const [lat, lng] = v.center;
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return false;
  }
  return typeof v.zoom === "number" && Number.isFinite(v.zoom) && v.zoom > 0;
}

export function readSavedMapView(): MapView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isValidMapView(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveMapView(view: MapView): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(view));
}

export function clearSavedMapView(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function resolveMapView(): MapView {
  return readSavedMapView() ?? { center: GEORGIA_CENTER, zoom: GEORGIA_ZOOM };
}

export function formatMapViewSnippet(view: MapView): string {
  const [lat, lng] = view.center;
  return [
    `export const GEORGIA_CENTER: [number, number] = [${lat.toFixed(2)}, ${lng.toFixed(2)}];`,
    `export const GEORGIA_ZOOM = ${Number(view.zoom.toFixed(2))};`,
  ].join("\n");
}

export function viewFromMap(map: {
  getCenter(): { lat: number; lng: number };
  getZoom(): number;
}): MapView {
  const c = map.getCenter();
  return { center: [c.lat, c.lng], zoom: map.getZoom() };
}
