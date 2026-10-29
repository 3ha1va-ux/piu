"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClientReady, useLatestRef } from "@/lib/useClientReady";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { PetListing, ListingTone, AnimalType } from "@/data/listings-types";
import {
  GEORGIA_CENTER,
  GEORGIA_MAX_BOUNDS,
  GEORGIA_MAX_BOUNDS_VISCOSITY,
  GEORGIA_ZOOM,
} from "@/data/listings-types";
import type { MapBBox, ServerCluster, ToneCounts } from "@/data/listings-types";
import {
  clearSavedMapView,
  formatMapViewSnippet,
  resolveMapView,
  saveMapView,
  viewFromMap,
} from "@/lib/mapFrame";
import { mapPinHtml, markerVisual, toneColor, TONE_COLORS } from "@/lib/markerStyles";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

type ToneMarkerOptions = L.MarkerOptions & { listingTone?: ListingTone };

export type ViewportPayload = {
  bbox: MapBBox;
  zoom: number;
};

export type FocusTarget = {
  id: string;
  lat: number;
  lng: number;
};

/** Place search target — fly like Google Maps (city vs district zoom). */
export type PlaceTarget = {
  id: string;
  lat: number;
  lng: number;
  zoom: number;
  /** [west, south, east, north] */
  bbox?: [number, number, number, number];
};

type SelectHandler = (id: string | null, listing?: PetListing | null) => void;

type PetMapProps = {
  listings: PetListing[];
  clusters: ServerCluster[];
  activeId: string | null;
  /** Selected listing kept visible through zoom (above clusters) */
  pinnedListing?: PetListing | null;
  /** Pan/zoom map to the pin (URL focus / search). False when picking on the map. */
  panToPinned?: boolean;
  focusTarget?: FocusTarget | null;
  placeTarget?: PlaceTarget | null;
  onSelect: SelectHandler;
  onViewportChange: (payload: ViewportPayload) => void;
};

function markerIcon(animal: AnimalType, tone: ListingTone, active: boolean) {
  const { html, width, height, tipY } = mapPinHtml(animal, tone, active);

  return L.divIcon({
    className: "ipove-marker",
    iconSize: [width, height],
    iconAnchor: [width / 2, tipY],
    popupAnchor: [0, -tipY + 6],
    html,
  });
}

function countClusterTones(cluster: L.MarkerCluster): ToneCounts {
  const counts: ToneCounts = { lost: 0, gift: 0, found: 0 };
  for (const layer of cluster.getAllChildMarkers()) {
    const tone =
      (layer.options as ToneMarkerOptions).listingTone ?? ("found" as ListingTone);
    counts[tone] += 1;
  }
  return counts;
}

function clusterBackground(counts: ToneCounts): string {
  const total = counts.lost + counts.gift + counts.found;
  if (total === 0) return TONE_COLORS.found.pin;

  const parts: string[] = [];
  let acc = 0;
  for (const tone of ["lost", "gift", "found"] as ListingTone[]) {
    if (counts[tone] === 0) continue;
    const start = (acc / total) * 100;
    acc += counts[tone];
    const end = (acc / total) * 100;
    parts.push(`${TONE_COLORS[tone].pin} ${start}% ${end}%`);
  }
  if (parts.length === 1) return parts[0].split(" ")[0];
  return `conic-gradient(${parts.join(", ")})`;
}

function bubbleIconHtml(count: number, counts: ToneCounts): string {
  const size = count < 10 ? "sm" : count < 40 ? "md" : "lg";
  const bg = clusterBackground(counts);
  const tonesPresent = (["lost", "gift", "found"] as ListingTone[]).filter(
    (t) => counts[t] > 0,
  );
  const mixed = tonesPresent.length > 1;
  const darkText =
    mixed || (tonesPresent.length === 1 && tonesPresent[0] === "gift");
  return `<div class="ipove-cluster-bubble ipove-cluster-${size}${mixed ? " ipove-cluster-mixed" : ""}${darkText ? " ipove-cluster-dark" : ""}" style="background:${bg}"><span>${count}</span></div>`;
}

function leafletClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const counts = countClusterTones(cluster);
  const px = count < 10 ? 30 : count < 40 ? 34 : 38;
  return L.divIcon({
    className: "ipove-cluster",
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    html: bubbleIconHtml(count, counts),
  });
}

function serverClusterIcon(cluster: ServerCluster) {
  const px = cluster.count < 10 ? 30 : cluster.count < 40 ? 34 : 38;
  return L.divIcon({
    className: "ipove-cluster",
    iconSize: [px, px],
    iconAnchor: [px / 2, px / 2],
    html: bubbleIconHtml(cluster.count, cluster.tones),
  });
}

function ViewportReporter({
  onViewportChange,
}: {
  onViewportChange: (payload: ViewportPayload) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const emit = () => {
      const b = map.getBounds();
      onViewportChange({
        bbox: {
          west: b.getWest(),
          south: b.getSouth(),
          east: b.getEast(),
          north: b.getNorth(),
        },
        zoom: map.getZoom(),
      });
    };

    emit();
    map.on("moveend", emit);
    map.on("zoomend", emit);
    return () => {
      map.off("moveend", emit);
      map.off("zoomend", emit);
    };
  }, [map, onViewportChange]);

  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function listingTooltipHtml(item: PetListing): string {
  const visual = markerVisual(item.animal, item.tone);
  return [
    `<div class="ipove-tip">`,
    `<p class="ipove-tip-cap" style="color:${toneColor(item.tone)}">${escapeHtml(visual.caption)}</p>`,
    `<p class="ipove-tip-name">${escapeHtml(item.name)}</p>`,
    `<p class="ipove-tip-place">${escapeHtml(item.place)}</p>`,
    `</div>`,
  ].join("");
}

function listingPopupHtml(item: PetListing): string {
  const visual = markerVisual(item.animal, item.tone);
  const photo =
    item.photoUrls?.[
      Math.min(
        Math.max(0, item.mainPhotoIndex ?? 0),
        (item.photoUrls?.length ?? 1) - 1,
      )
    ] ?? item.photoUrls?.[0];
  const detailHref = `/gancxadeba/${encodeURIComponent(item.id)}`;

  return [
    `<a class="ipove-popup" href="${detailHref}">`,
    photo
      ? `<div class="ipove-popup-media"><img class="ipove-popup-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}" draggable="false" /></div>`
      : "",
    `<div class="ipove-popup-body">`,
    `<p class="ipove-popup-cap" style="color:${toneColor(item.tone)}">${escapeHtml(visual.caption)}</p>`,
    `<p class="ipove-popup-name">${escapeHtml(item.name)}</p>`,
    `<p class="ipove-popup-place">${escapeHtml(item.place)}</p>`,
    `</div>`,
    `</a>`,
  ].join("");
}

function wirePopupLink(popup: L.Popup) {
  const root = popup.getElement();
  const container = root?.querySelector<HTMLElement>(".ipove-popup");
  if (!container || container.dataset.wired === "1") return;
  container.dataset.wired = "1";
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);
}

function ClusteredMarkers({
  listings,
  activeId,
  onSelect,
}: {
  listings: PetListing[];
  activeId: string | null;
  onSelect: SelectHandler;
}) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersByIdRef = useRef(new Map<string, L.Marker>());
  const listingByIdRef = useRef(new Map<string, PetListing>());
  const onSelectRef = useLatestRef(onSelect);
  const activeIdRef = useLatestRef(activeId);
  const prevActiveIdRef = useRef<string | null>(null);
  const zoomingRef = useRef(false);
  const pendingListingsRef = useRef<PetListing[] | null>(null);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Rebuild cluster tree from scratch — kills stacked ghost bubbles. */
  const remountMarkers = useRef(() => {
    const clusterGroup = groupRef.current;
    if (!clusterGroup) return;
    const markers = Array.from(markersByIdRef.current.values());
    clusterGroup.clearLayers();
    if (markers.length === 1) clusterGroup.addLayer(markers[0]!);
    else if (markers.length > 1) clusterGroup.addLayers(markers);
  });

  const syncListings = useRef((nextListings: PetListing[]) => {
    if (!groupRef.current) return;

    const markersById = markersByIdRef.current;
    const listingById = listingByIdRef.current;
    const nextIds = new Set(nextListings.map((item) => item.id));
    listingById.clear();
    for (const item of nextListings) listingById.set(item.id, item);

    let structureChanged = false;

    for (const id of Array.from(markersById.keys())) {
      if (nextIds.has(id)) continue;
      markersById.delete(id);
      structureChanged = true;
    }

    for (const item of nextListings) {
      const existing = markersById.get(item.id);
      if (existing) {
        const latLng = existing.getLatLng();
        if (latLng.lat !== item.lat || latLng.lng !== item.lng) {
          existing.setLatLng([item.lat, item.lng]);
          structureChanged = true;
        }
        existing.setPopupContent(listingPopupHtml(item));
        existing.setTooltipContent(listingTooltipHtml(item));
        continue;
      }

      const marker = L.marker([item.lat, item.lng], {
        icon: markerIcon(
          item.animal,
          item.tone,
          item.id === activeIdRef.current,
        ),
        listingTone: item.tone,
      } as ToneMarkerOptions);

      marker.bindTooltip(listingTooltipHtml(item), {
        direction: "top",
        offset: [0, -28],
        opacity: 1,
        className: "ipove-tooltip",
      });
      marker.bindPopup(listingPopupHtml(item), {
        maxWidth: 300,
        minWidth: 240,
        className: "ipove-popup-wrap",
        autoPanPadding: [48, 48],
      });
      marker.on("popupopen", (event) => {
        wirePopupLink(event.popup);
      });
      marker.on("click", () => {
        onSelectRef.current(item.id, item);
      });

      markersById.set(item.id, marker);
      structureChanged = true;
    }

    // Always remount the cluster group after structural changes so leaflet
    // never keeps a faded/duplicated bubble from a prior zoom step.
    if (structureChanged) remountMarkers.current();
  });

  useEffect(() => {
    // animate:false — leaflet.markercluster zoom anim leaves ghost bubbles stacked
    // on top of the real cluster (identical counts like 27 over 27).
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      spiderfyOnMaxZoom: true,
      spiderfyDistanceMultiplier: 1.6,
      disableClusteringAtZoom: 14,
      // Must exceed bubble diameter (~42px with ring) so sibling clusters don't overlap
      maxClusterRadius: (zoom: number) => {
        if (zoom < 11) return 110;
        if (zoom < 13) return 90;
        return 70;
      },
      chunkedLoading: false,
      animate: false,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: leafletClusterIcon,
    });

    clusterGroup.on("clusterclick", (event) => {
      const cluster = event.layer as L.MarkerCluster;
      const count = cluster.getChildCount();
      const bounds = cluster.getBounds();
      const targetZoom = map.getBoundsZoom(bounds, false);
      const currentZoom = map.getZoom();
      const shouldSpiderfy =
        count <= 40 ||
        targetZoom <= currentZoom + 1 ||
        currentZoom >= map.getMaxZoom() - 1;

      if (shouldSpiderfy) {
        cluster.spiderfy();
        return;
      }

      map.fitBounds(bounds.pad(0.2), {
        padding: [48, 48],
        maxZoom: Math.min(16, Math.max(targetZoom, currentZoom + 2)),
      });
    });

    groupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    const onZoomStart = () => {
      zoomingRef.current = true;
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    };
    const onZoomEnd = () => {
      zoomingRef.current = false;
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        settleTimerRef.current = null;
        const pending = pendingListingsRef.current;
        if (pending) {
          pendingListingsRef.current = null;
          syncListings.current(pending);
        } else {
          remountMarkers.current();
        }
      }, 0);
    };

    map.on("zoomstart", onZoomStart);
    map.on("zoomend", onZoomEnd);

    const markersById = markersByIdRef.current;
    const listingById = listingByIdRef.current;

    return () => {
      map.off("zoomstart", onZoomStart);
      map.off("zoomend", onZoomEnd);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      map.removeLayer(clusterGroup);
      clusterGroup.clearLayers();
      groupRef.current = null;
      markersById.clear();
      listingById.clear();
      pendingListingsRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    if (zoomingRef.current) {
      pendingListingsRef.current = listings;
      return;
    }
    syncListings.current(listings);
  }, [listings]);

  useEffect(() => {
    const markersById = markersByIdRef.current;
    const listingById = listingByIdRef.current;
    const prev = prevActiveIdRef.current;
    prevActiveIdRef.current = activeId;

    for (const id of [prev, activeId]) {
      if (!id) continue;
      const marker = markersById.get(id);
      const item = listingById.get(id);
      if (!marker || !item) continue;
      // Dim clustered copy while pinned overlay shows the active card
      marker.setIcon(markerIcon(item.animal, item.tone, false));
      if (id === activeId && marker.isPopupOpen()) marker.closePopup();
    }
  }, [activeId]);

  return null;
}

function ServerClusterLayer({ clusters }: { clusters: ServerCluster[] }) {
  const map = useMap();

  useEffect(() => {
    const group = L.layerGroup();
    for (const c of clusters) {
      const marker = L.marker([c.lat, c.lng], { icon: serverClusterIcon(c) });
      marker.on("click", () => {
        // Jump past grid mode and past client reclustering so child pins stay visible.
        const nextZoom = Math.min(Math.max(map.getZoom() + 3, 14), 16);
        map.flyTo([c.lat, c.lng], nextZoom, {
          duration: 0.7,
        });
      });
      group.addLayer(marker);
    }
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
    };
  }, [map, clusters]);

  return null;
}

/**
 * Selected listing pin — lives outside the cluster layer so zoom
 * in/out never removes the open info card.
 */
function PinnedListingMarker({
  listing,
  panTo,
  onSelect,
}: {
  listing: PetListing;
  panTo: boolean;
  onSelect: SelectHandler;
}) {
  const map = useMap();
  const onSelectRef = useLatestRef(onSelect);
  const listingRef = useLatestRef(listing);

  useEffect(() => {
    const current = listingRef.current;
    let removedByCleanup = false;
    const marker = L.marker([current.lat, current.lng], {
      icon: markerIcon(current.animal, current.tone, true),
      zIndexOffset: 2000,
      keyboard: false,
      listingTone: current.tone,
    } as ToneMarkerOptions);

    marker.bindPopup(listingPopupHtml(current), {
      maxWidth: 300,
      minWidth: 240,
      className: "ipove-popup-wrap",
      autoPanPadding: [56, 56],
      closeOnClick: false,
      autoClose: false,
      closeOnEscapeKey: true,
    });
    marker.on("popupopen", (event) => {
      wirePopupLink(event.popup);
    });
    // X / Escape — clear selection so move/zoom does not bring the card back
    marker.on("popupclose", () => {
      if (removedByCleanup) return;
      onSelectRef.current(null);
    });
    marker.on("click", () => {
      onSelectRef.current(current.id, current);
      marker.openPopup();
    });

    marker.addTo(map);

    if (panTo) {
      const zoom = Math.max(map.getZoom(), 15);
      map.setView([current.lat, current.lng], zoom, { animate: true });
    }

    const open = () => {
      if (!map.getBounds().contains(marker.getLatLng())) {
        map.panTo(marker.getLatLng(), { animate: true });
      }
      marker.openPopup();
    };

    const t = window.setTimeout(open, panTo ? 280 : 40);

    return () => {
      removedByCleanup = true;
      window.clearTimeout(t);
      map.removeLayer(marker);
    };
  }, [
    map,
    listing.id,
    listing.lat,
    listing.lng,
    listing.animal,
    listing.tone,
    panTo,
    listingRef,
    onSelectRef,
  ]);

  return null;
}

function MapBlankClick({ onSelect }: { onSelect: SelectHandler }) {
  const map = useMap();
  const onSelectRef = useLatestRef(onSelect);

  useEffect(() => {
    const clear = (event: L.LeafletMouseEvent) => {
      const target = event.originalEvent.target as HTMLElement | null;
      if (
        target?.closest?.(
          ".leaflet-marker-icon, .leaflet-popup, .ipove-popup, .ipove-cluster, .leaflet-control",
        )
      ) {
        return;
      }
      onSelectRef.current(null);
    };
    map.on("click", clear);
    return () => {
      map.off("click", clear);
    };
  }, [map, onSelectRef]);

  return null;
}

/**
 * First load: fixed center + zoom so Georgia is the same visual size on every screen.
 * (fitBounds made wide vs tall monitors look different — that was the two-photo gap.)
 */
function FitGeorgiaOnBoot({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const doneRef = useRef(false);

  useEffect(() => {
    if (!enabled || doneRef.current) return;

    let cancelled = false;
    const apply = () => {
      if (cancelled || doneRef.current) return;
      doneRef.current = true;
      map.invalidateSize();
      const view = resolveMapView();
      map.setView(view.center, view.zoom, { animate: false });
    };

    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(apply);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [map, enabled]);

  return null;
}

/** Mouse-tune on the screen you like, then save — same zoom on the other monitor. */
function MapFrameSaveControl() {
  const map = useMap();
  const host = map.getContainer();
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 3200);
    return () => window.clearTimeout(t);
  }, [note]);

  function persistCurrentView() {
    const view = viewFromMap(map);
    saveMapView(view);
    const snippet = formatMapViewSnippet(view);
    void navigator.clipboard.writeText(snippet).catch(() => undefined);
    console.info("[იპოვე] საწყისი ხედი შენახულია:\n" + snippet);
    setNote("შენახულია — განაახლე მეორე ეკრანიც");
  }

  function resetToCodeDefault() {
    clearSavedMapView();
    const view = resolveMapView();
    map.setView(view.center, view.zoom, { animate: true });
    setNote("ნაგულისხმევი ხედი აღდგა");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "g")) return;
      if (
        e.target instanceof HTMLElement &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable)
      ) {
        return;
      }
      e.preventDefault();
      const view = viewFromMap(map);
      saveMapView(view);
      const snippet = formatMapViewSnippet(view);
      void navigator.clipboard.writeText(snippet).catch(() => undefined);
      console.info("[იპოვე] საწყისი ხედი შენახულია:\n" + snippet);
      setNote("შენახულია — განაახლე მეორე ეკრანიც");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [map]);

  if (!host) return null;

  return createPortal(
    <div className="pointer-events-auto absolute left-3 top-20 z-[1100] flex max-w-[13.5rem] flex-col gap-1.5 md:top-4">
      <button
        type="button"
        onClick={persistCurrentView}
        className="rounded-xl border border-moss/15 bg-white/95 px-3 py-2 text-left text-[12px] font-semibold text-ink shadow-[0_8px_24px_rgba(20,32,28,0.14)] backdrop-blur-md transition hover:bg-mist"
      >
        ეს ხედი შეინახე
      </button>
      <button
        type="button"
        onClick={resetToCodeDefault}
        className="rounded-xl border border-moss/10 bg-white/80 px-3 py-1.5 text-left text-[11px] font-medium text-ink-soft backdrop-blur-md transition hover:bg-mist hover:text-ink"
      >
        ნაგულისხმევი
      </button>
      {note ? (
        <p className="rounded-lg bg-ink/90 px-2.5 py-1.5 text-[11px] font-medium text-white">
          {note}
        </p>
      ) : (
        <p className="px-0.5 text-[10px] leading-snug text-ink-soft/90 drop-shadow">
          მოარგე იმ ეკრანზე, რომელიც მოგწონს → შეინახე
        </p>
      )}
    </div>,
    host,
  );
}

/** Fly/fit to a searched place (Tbilisi vs Avlabari style zoom). */
function PlaceFlight({ target }: { target: PlaceTarget | null }) {
  const map = useMap();
  const flownIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!target) return;
    if (flownIdRef.current === target.id) return;
    flownIdRef.current = target.id;

    if (target.bbox) {
      const [west, south, east, north] = target.bbox;
      map.flyToBounds(
        [
          [south, west],
          [north, east],
        ],
        {
          padding: [48, 48],
          maxZoom: Math.min(16, Math.max(target.zoom, 11)),
          duration: 0.85,
        },
      );
      return;
    }

    map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.85 });
  }, [map, target]);

  return null;
}

export default function PetMap({
  listings,
  clusters,
  activeId,
  pinnedListing = null,
  panToPinned = false,
  focusTarget = null,
  placeTarget = null,
  onSelect,
  onViewportChange,
}: PetMapProps) {
  const ready = useClientReady();
  const hasFocusBoot = Boolean(pinnedListing || focusTarget);
  const [boot] = useState(() => ({
    center: (pinnedListing
      ? [pinnedListing.lat, pinnedListing.lng]
      : focusTarget
        ? [focusTarget.lat, focusTarget.lng]
        : GEORGIA_CENTER) as [number, number],
    zoom: pinnedListing || focusTarget ? 15 : GEORGIA_ZOOM,
    key:
      pinnedListing || focusTarget
        ? `boot-${(pinnedListing ?? focusTarget)!.id}`
        : "ipove-georgia-map",
    fitGeorgia: !hasFocusBoot,
  }));

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#d8e6df] text-moss">
        <p className="text-sm font-medium">რუკა იტვირთება…</p>
      </div>
    );
  }

  const clusterListings = pinnedListing
    ? listings.filter((item) => item.id !== pinnedListing.id)
    : listings;

  return (
    <MapContainer
      key={boot.key}
      center={boot.center}
      zoom={boot.zoom}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={true}
      minZoom={6.5}
      maxZoom={19}
      maxBounds={GEORGIA_MAX_BOUNDS}
      maxBoundsViscosity={GEORGIA_MAX_BOUNDS_VISCOSITY}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains={["a", "b", "c"]}
        maxZoom={19}
        maxNativeZoom={19}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ZoomControl position="bottomright" />
      <FitGeorgiaOnBoot enabled={boot.fitGeorgia} />
      <MapFrameSaveControl />
      <ViewportReporter onViewportChange={onViewportChange} />
      <PlaceFlight target={placeTarget} />
      <MapBlankClick onSelect={onSelect} />
      {clusters.length > 0 ? (
        <ServerClusterLayer clusters={clusters} />
      ) : (
        <ClusteredMarkers
          listings={clusterListings}
          activeId={activeId}
          onSelect={onSelect}
        />
      )}
      {pinnedListing ? (
        <PinnedListingMarker
          listing={pinnedListing}
          panTo={panToPinned}
          onSelect={onSelect}
        />
      ) : null}
    </MapContainer>
  );
}
