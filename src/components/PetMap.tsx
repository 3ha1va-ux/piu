"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { resolveMapView } from "@/lib/mapFrame";
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
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

  return [
    `<a class="ipove-popup" href="${detailHref}">`,
    photo
      ? `<div class="ipove-popup-media"><img class="ipove-popup-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}" draggable="false" /></div>`
      : "",
    `<div class="ipove-popup-body">`,
    `<p class="ipove-popup-cap" style="color:${toneColor(item.tone)}">${escapeHtml(visual.caption)}</p>`,
    `<p class="ipove-popup-name">${escapeHtml(item.name)}</p>`,
    `<p class="ipove-popup-place">${escapeHtml(item.place)}</p>`,
    `<div class="ipove-popup-actions" style="margin-top:8px; display:flex; gap:6px;">`,
    `<span style="flex:1; padding:5px 8px; font-size:11px; font-weight:600; text-align:center; border-radius:8px; background:var(--moss,#1f4a3a); color:#fff; display:block;">დეტალურად</span>`,
    `<button type="button" class="ipove-popup-nav-btn" data-nav="${navUrl}" style="padding:5px 8px; font-size:11px; font-weight:600; text-align:center; border-radius:8px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; display:inline-flex; align-items:center; gap:3px; cursor:pointer;">🗺️ ნავიგაცია</button>`,
    `</div>`,
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

  const navBtn = container.querySelector<HTMLButtonElement>(".ipove-popup-nav-btn");
  if (navBtn) {
    navBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const url = navBtn.dataset.nav;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  }
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
      disableClusteringAtZoom: 16,
      maxClusterRadius: (zoom: number) => {
        if (zoom < 9) return 100;
        if (zoom < 12) return 85;
        if (zoom < 14) return 70;
        return 55;
      },
      chunkedLoading: true,
      animate: true,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: leafletClusterIcon,
    });

    clusterGroup.on("clusterclick", (event) => {
      const cluster = event.layer as L.MarkerCluster;
      const bounds = cluster.getBounds();
      const targetZoom = map.getBoundsZoom(bounds, false);
      const currentZoom = map.getZoom();

      const shouldSpiderfy =
        targetZoom <= currentZoom || currentZoom >= 17;

      if (shouldSpiderfy) {
        cluster.spiderfy();
        return;
      }

      map.flyToBounds(bounds.pad(0.25), {
        duration: 0.55,
        easeLinearity: 0.25,
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
        }
      }, 50);
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
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, [map]);

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

function UserLocationControl() {
  const map = useMap();
  const userMarkerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    let isLocating = false;

    // Create a native Leaflet Control that sits in the official control stack
    const LocateControl = L.Control.extend({
      options: { position: "bottomright" },
      onAdd: function () {
        const container = L.DomUtil.create(
          "div",
          "leaflet-control-locate leaflet-bar leaflet-control !border-none !shadow-[0_4px_16px_rgba(20,32,28,0.18)] !rounded-xl overflow-hidden mb-2"
        );

        const button = L.DomUtil.create(
          "button",
          "flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center bg-white/95 text-[var(--moss)] hover:bg-[var(--paper)] active:scale-95 transition touch-manipulation cursor-pointer",
          container
        );
        button.type = "button";
        button.title = "ჩემი მდებარეობის პოვნა რუკაზე";
        button.setAttribute("aria-label", "ჩემი მდებარეობა");

        const renderIcon = (loading: boolean) => {
          if (loading) {
            button.innerHTML = `
              <div class="h-4 w-4 border-2 border-[var(--moss)] border-t-transparent rounded-full animate-spin"></div>
            `;
            button.setAttribute("disabled", "true");
            button.style.opacity = "0.7";
          } else {
            button.innerHTML = `
              <svg class="w-5 h-5 text-[var(--moss)]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="7" stroke-width="2" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <path stroke-linecap="round" stroke-width="2" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
            `;
            button.removeAttribute("disabled");
            button.style.opacity = "1";
          }
        };

        renderIcon(false);

        // CRITICAL: Prevent Leaflet map dragging/clicks from swallowing touches on this control!
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const triggerLocate = () => {
          if (isLocating) return;

          if (typeof window === "undefined" || !("geolocation" in navigator)) {
            alert("თქვენს მოწყობილობას არ აქვს GPS / ლოკაციის მხარდაჭერა.");
            return;
          }

          isLocating = true;
          renderIcon(true);

          const onSuccess = (pos: GeolocationPosition) => {
            isLocating = false;
            renderIcon(false);
            const { latitude, longitude, accuracy } = pos.coords;

            // Remove existing location marker & halo if any
            if (userMarkerRef.current) {
              map.removeLayer(userMarkerRef.current);
              userMarkerRef.current = null;
            }

            const group = L.layerGroup();

            // Accuracy radius halo
            const halo = L.circle([latitude, longitude], {
              radius: Math.min(Math.max(accuracy || 30, 25), 400),
              color: "#2563eb",
              weight: 1.5,
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
            });
            group.addLayer(halo);

            // Pulsing core marker
            const marker = L.circleMarker([latitude, longitude], {
              radius: 8,
              color: "#ffffff",
              weight: 2.5,
              fillColor: "#2563eb",
              fillOpacity: 1,
            });
            marker.bindTooltip("თქვენ აქ იმყოფებით", {
              permanent: false,
              direction: "top",
            });
            group.addLayer(marker);

            group.addTo(map);
            userMarkerRef.current = group;

            map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
              duration: 0.9,
            });
          };

          const onError = (err: GeolocationPositionError) => {
            console.warn("Geolocation attempt 1 failed:", err);
            // If high accuracy timed out or unavailable, try fallback with low accuracy (Wi-Fi/Cell)
            if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
              navigator.geolocation.getCurrentPosition(
                onSuccess,
                (err2) => {
                  isLocating = false;
                  renderIcon(false);
                  console.warn("Fallback geolocation also failed:", err2);
                  showGeoAlert(err2);
                },
                { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
              );
              return;
            }

            isLocating = false;
            renderIcon(false);
            showGeoAlert(err);
          };

          const showGeoAlert = (error: GeolocationPositionError) => {
            if (error.code === error.PERMISSION_DENIED) {
              alert(
                "ლოკაციის გაზიარება დაბლოკილია. გთხოვთ, ბრაუზერის პარამეტრებში ჩართოთ ლოკაცია piu.ge-სთვის."
              );
            } else if (error.code === error.TIMEOUT) {
              alert("ლოკაციის დადგენის დრო ამოიწურა. გთხოვთ, სცადოთ ხელახლა.");
            } else {
              alert("თქვენი მდებარეობის დადგენა ვერ მოხერხდა. შეამოწმეთ მოწყობილობის GPS.");
            }
          };

          navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 30000,
          });
        };

        L.DomEvent.on(button, "click", (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          triggerLocate();
        });

        // Also add touchend listener for instantaneous response on mobile devices
        L.DomEvent.on(button, "touchend", (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          triggerLocate();
        });

        return container;
      },
    });

    const control = new LocateControl();
    control.addTo(map);

    return () => {
      control.remove();
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }
    };
  }, [map]);

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
      <UserLocationControl />
      <FitGeorgiaOnBoot enabled={boot.fitGeorgia} />
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
