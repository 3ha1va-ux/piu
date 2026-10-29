"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type {
  AnimalType,
  ListingTone,
  ListingsQueryResult,
  MapBBox,
  PetListing,
  ServerCluster,
} from "@/data/listings-types";
import SearchConsole, {
  type PlaceSuggestion,
} from "@/components/SearchConsole";
import VirtualListingList from "@/components/VirtualListingList";
import { ANIMAL_COLORS, TONE_COLORS } from "@/lib/markerStyles";
import type {
  FocusTarget,
  PlaceTarget,
  ViewportPayload,
} from "@/components/PetMap";

const FOCUS_STORAGE_KEY = "ipove-map-focus";

/** Hard reset to default map view, filters, and selection. */
function resetToHome() {
  try {
    sessionStorage.removeItem(FOCUS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  const onHome =
    window.location.pathname === "/" &&
    window.location.search === "" &&
    window.location.hash === "";
  // Same URL does not reload by itself — force a full refresh.
  if (onHome) {
    window.location.reload();
    return;
  }
  window.location.href = "/";
}

const PetMap = dynamic(() => import("@/components/PetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#d8e6df] text-moss">
      <p className="animate-pulse text-sm font-medium">რუკა იტვირთება…</p>
    </div>
  ),
});

const ALL_TONES: ListingTone[] = ["lost", "gift", "found"];
const ALL_ANIMALS: AnimalType[] = ["ძაღლი", "კატა"];

const TONE_OPTIONS: { value: ListingTone; label: string }[] = [
  { value: "lost", label: "დაკარგული" },
  { value: "gift", label: "ჩუქდება" },
  { value: "found", label: "ნაპოვნი" },
];

const ANIMAL_OPTIONS: { value: AnimalType; label: string }[] = [
  { value: "ძაღლი", label: "ძაღლი" },
  { value: "კატა", label: "კატა" },
];

const PIN_CLIP =
  "path('M6 16 C6 16 1 10 1 5.5 C1 2.5 3.2 0.5 6 0.5 C8.8 0.5 11 2.5 11 5.5 C11 10 6 16 6 16 Z')";

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function listingsUrl(
  bbox: MapBBox,
  zoom: number,
  tones: ListingTone[],
  animals: AnimalType[],
): string {
  const params = new URLSearchParams({
    west: String(bbox.west),
    south: String(bbox.south),
    east: String(bbox.east),
    north: String(bbox.north),
    zoom: String(zoom),
    tones: tones.join(","),
    animals: animals.join(","),
  });
  return `/api/listings?${params.toString()}`;
}

function FilterCheck({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      className={`flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-[6px] border-2 transition ${
        on ? "border-transparent text-white" : "border-moss/25 bg-white"
      }`}
      style={on ? { backgroundColor: color } : undefined}
      aria-hidden
    >
      {on ? (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6.2 L5 8.7 L9.5 3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

function FilterFields({
  toneFilters,
  animalFilters,
  onTone,
  onAnimal,
  dense = false,
}: {
  toneFilters: ListingTone[];
  animalFilters: AnimalType[];
  onTone: (value: ListingTone) => void;
  onAnimal: (value: AnimalType) => void;
  dense?: boolean;
}) {
  return (
    <div className={dense ? "space-y-5" : "space-y-5"}>
      <fieldset>
        <legend className="text-[13px] font-semibold tracking-wide text-ink-soft">
          სტატუსი
        </legend>
        <ul className={`mt-2.5 ${dense ? "grid grid-cols-1 gap-2" : "flex flex-col gap-1.5"}`}>
          {TONE_OPTIONS.map(({ value, label }) => {
            const checked = toneFilters.includes(value);
            const color = TONE_COLORS[value].pin;
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => onTone(value)}
                  aria-pressed={checked}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition ${
                    checked
                      ? "bg-mist/80 text-ink"
                      : "text-ink-soft hover:bg-paper hover:text-ink"
                  } ${dense ? "border border-moss/10 bg-paper/70 py-3.5" : ""}`}
                >
                  <FilterCheck on={checked} color={color} />
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-[13px] font-semibold tracking-wide text-ink-soft">
          ცხოველი
        </legend>
        <ul
          className={`mt-2.5 ${
            dense ? "grid grid-cols-2 gap-2" : "flex flex-col gap-1.5"
          }`}
        >
          {ANIMAL_OPTIONS.map(({ value, label }) => {
            const checked = animalFilters.includes(value);
            const color = ANIMAL_COLORS[value];
            return (
              <li key={value}>
                <button
                  type="button"
                  onClick={() => onAnimal(value)}
                  aria-pressed={checked}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[15px] font-medium transition ${
                    checked
                      ? "bg-mist/80 text-ink"
                      : "text-ink-soft hover:bg-paper hover:text-ink"
                  } ${dense ? "border border-moss/10 bg-paper/70 py-3.5" : ""}`}
                >
                  <FilterCheck on={checked} color={color} />
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0"
                    style={
                      value === "ძაღლი"
                        ? {
                            backgroundColor: color,
                            borderRadius: "999px",
                          }
                        : {
                            width: 0,
                            height: 0,
                            borderLeft: "5px solid transparent",
                            borderRight: "5px solid transparent",
                            borderTop: `9px solid ${color}`,
                            backgroundColor: "transparent",
                          }
                    }
                    aria-hidden
                  />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </div>
  );
}

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center" aria-hidden>
      {children}
    </span>
  );
}

export default function MapExperience() {
  const [toneFilters, setToneFilters] = useState<ListingTone[]>([...ALL_TONES]);
  const [animalFilters, setAnimalFilters] =
    useState<AnimalType[]>([...ALL_ANIMALS]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [placeTarget, setPlaceTarget] = useState<PlaceTarget | null>(null);
  const [pinnedListing, setPinnedListing] = useState<PetListing | null>(null);
  const [panToPinned, setPanToPinned] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusReady, setFocusReady] = useState(false);
  const [items, setItems] = useState<PetListing[]>([]);
  const [clusters, setClusters] = useState<ServerCluster[]>([]);
  const [totalMatched, setTotalMatched] = useState(0);
  const [loading, setLoading] = useState(false);

  const lastViewportRef = useRef<ViewportPayload | null>(null);
  const lastFetchedKeyRef = useRef<string | null>(null);
  const itemsRef = useRef<PetListing[]>([]);
  const clustersRef = useRef<ServerCluster[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGenRef = useRef(0);

  const focusIdRef = useRef<string | null>(null);
  const focusListingRef = useRef<PetListing | null>(null);
  const focusPendingRef = useRef(false);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    clustersRef.current = clusters;
  }, [clusters]);

  const filtersRestricted =
    toneFilters.length !== ALL_TONES.length ||
    animalFilters.length !== ALL_ANIMALS.length;

  const applyFocusListing = useCallback(
    (listing: PetListing, options?: { pan?: boolean }) => {
      const pan = options?.pan ?? true;
      focusIdRef.current = listing.id;
      focusListingRef.current = listing;
      focusPendingRef.current = pan;
      try {
        sessionStorage.setItem(FOCUS_STORAGE_KEY, listing.id);
      } catch {
        /* ignore */
      }
      setActiveId(listing.id);
      setPinnedListing(listing);
      setPanToPinned(pan);
      setFocusTarget({ id: listing.id, lat: listing.lat, lng: listing.lng });
      if (pan) {
        setClusters([]);
      }
      // Keep selected listing at the top of the sidebar so it never "vanishes"
      setItems((prev) => [
        listing,
        ...prev.filter((item) => item.id !== listing.id),
      ]);
    },
    [],
  );

  const handleSelect = useCallback(
    (id: string | null, listing?: PetListing | null) => {
      if (!id) {
        setActiveId(null);
        setPinnedListing(null);
        setPanToPinned(false);
        setFocusTarget(null);
        focusIdRef.current = null;
        focusListingRef.current = null;
        focusPendingRef.current = false;
        try {
          sessionStorage.removeItem(FOCUS_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        return;
      }

      const resolved =
        listing ??
        itemsRef.current.find((item) => item.id === id) ??
        (pinnedListing?.id === id ? pinnedListing : null) ??
        focusListingRef.current;

      if (resolved) {
        applyFocusListing(resolved, { pan: false });
        return;
      }

      setActiveId(id);
    },
    [applyFocusListing, pinnedListing],
  );

  useEffect(() => {
    const focusId = new URLSearchParams(window.location.search).get("focus");
    if (!focusId) {
      // Defer so we don't sync-setState in the effect body (React 19 lint).
      const t = window.setTimeout(() => setFocusReady(true), 0);
      return () => window.clearTimeout(t);
    }

    focusIdRef.current = focusId;
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `/api/listings/one?id=${encodeURIComponent(focusId)}`,
        );
        if (!res.ok || cancelled) {
          if (!cancelled) setFocusReady(true);
          return;
        }
        const data = (await res.json()) as { listing: PetListing };
        if (cancelled) return;
        applyFocusListing(data.listing);
        setFocusReady(true);
      } catch {
        if (!cancelled) setFocusReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyFocusListing]);

  useEffect(() => {
    if (!activeId) return;
    try {
      sessionStorage.setItem(FOCUS_STORAGE_KEY, activeId);
    } catch {
      /* ignore */
    }
  }, [activeId]);

  const applyResult = useCallback((data: ListingsQueryResult) => {
    const prevItems = itemsRef.current;
    const prevClusters = clustersRef.current;
    const focusListing = focusListingRef.current;

    // Keep selected pin in points mode while still animating to it.
    if (focusListing && focusPendingRef.current && data.mode === "grid") {
      setClusters([]);
      setTotalMatched(data.totalMatched);
      setItems((prev) =>
        prev.some((item) => item.id === focusListing.id)
          ? prev
          : [focusListing, ...prev],
      );
      return;
    }

    let nextItems = data.items;
    // Keep the selected listing visible at the top of the sidebar list.
    if (focusListing) {
      nextItems = [
        focusListing,
        ...nextItems.filter((item) => item.id !== focusListing.id),
      ];
    }

    if (data.mode === "points" && focusPendingRef.current) {
      focusPendingRef.current = false;
    }

    const sameItems =
      prevItems.length === nextItems.length &&
      prevItems.every((item, i) => item.id === nextItems[i]?.id);
    const sameClusters =
      prevClusters.length === data.clusters.length &&
      prevClusters.every(
        (c, i) =>
          c.id === data.clusters[i]?.id &&
          c.count === data.clusters[i]?.count,
      );

    if (!sameItems) setItems(nextItems);
    if (!sameClusters) setClusters(data.clusters);
    setTotalMatched(data.totalMatched);
  }, []);

  const fetchForViewport = useCallback(
    async (
      payload: ViewportPayload,
      tones: ListingTone[],
      animals: AnimalType[],
      force = false,
    ) => {
      const key = [
        payload.zoom.toFixed(2),
        payload.bbox.west.toFixed(4),
        payload.bbox.south.toFixed(4),
        payload.bbox.east.toFixed(4),
        payload.bbox.north.toFixed(4),
        tones.join(","),
        animals.join(","),
      ].join("|");

      if (!force && lastFetchedKeyRef.current === key) return;
      lastFetchedKeyRef.current = key;

      const gen = ++fetchGenRef.current;
      setLoading(true);
      try {
        const res = await fetch(
          listingsUrl(payload.bbox, payload.zoom, tones, animals),
        );
        if (!res.ok) return;
        const data = (await res.json()) as ListingsQueryResult;
        if (gen !== fetchGenRef.current) return;
        applyResult(data);
      } catch {
        /* ignore */
      } finally {
        if (gen === fetchGenRef.current) setLoading(false);
      }
    },
    [applyResult],
  );

  const onViewportChange = useCallback(
    (payload: ViewportPayload) => {
      lastViewportRef.current = payload;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchForViewport(payload, toneFilters, animalFilters);
      }, 220);
    },
    [fetchForViewport, toneFilters, animalFilters],
  );

  useEffect(() => {
    const vp = lastViewportRef.current;
    if (!vp) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    lastFetchedKeyRef.current = null;
    void fetchForViewport(vp, toneFilters, animalFilters, true);
  }, [toneFilters, animalFilters, fetchForViewport]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  function selectListing(listing: PetListing) {
    applyFocusListing(listing);
  }

  function selectPlace(place: PlaceSuggestion) {
    handleSelect(null);
    setPlaceTarget({
      id: `${place.source}-${place.lat.toFixed(5)}-${place.lng.toFixed(5)}-${Date.now()}`,
      lat: place.lat,
      lng: place.lng,
      zoom: place.zoom,
      bbox: place.bbox,
    });
  }

  function onTone(value: ListingTone) {
    setToneFilters((prev) => toggleInList(prev, value));
    handleSelect(null);
  }

  function onAnimal(value: AnimalType) {
    setAnimalFilters((prev) => toggleInList(prev, value));
    handleSelect(null);
  }

  return (
    <section className="ipove-map-shell relative isolate h-[100dvh] w-full overflow-hidden md:h-[100svh] md:min-h-[640px]">
      <div className="absolute inset-0 z-0">
        {focusReady ? (
          <PetMap
            listings={items}
            clusters={clusters}
            activeId={activeId}
            pinnedListing={pinnedListing}
            panToPinned={panToPinned}
            focusTarget={focusTarget}
            placeTarget={placeTarget}
            onSelect={handleSelect}
            onViewportChange={onViewportChange}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#d8e6df] text-moss">
            <p className="animate-pulse text-sm font-medium">რუკა იტვირთება…</p>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 z-10">
        {/* Top chrome — pointer-events only on controls so sidebar brand stays clickable */}
        <header
          className={`pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] transition-[padding] duration-300 md:px-8 md:pt-5 ${
            sidebarOpen ? "md:pl-[21rem]" : "md:pl-8"
          }`}
        >
          <div className="pointer-events-auto flex items-start gap-2 md:justify-end md:gap-3">
            <button
              type="button"
              onClick={resetToHome}
              className="inline-flex h-[42px] shrink-0 items-center rounded-2xl border border-moss/10 bg-white/95 px-3.5 font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-ink shadow-[0_8px_24px_rgba(20,32,28,0.12)] backdrop-blur-md transition hover:bg-white md:hidden"
              aria-label="piu.ge — მთავარ გვერდზე დაბრუნება"
            >
              piu.ge
            </button>
            <div className="min-w-0 flex-1 md:flex-none">
              <SearchConsole
                variant="map"
                onSelectListing={selectListing}
                onSelectPlace={selectPlace}
              />
            </div>
            <Link
              href="/gancxadeba"
              className="hidden h-[42px] shrink-0 items-center rounded-xl bg-moss px-4 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(31,74,58,0.28)] transition hover:bg-leaf md:inline-flex"
            >
              დამატება
            </Link>
          </div>
        </header>

        {/* Desktop sidebar — collapsible */}
        <aside
          className={`pointer-events-auto absolute bottom-0 left-0 top-0 z-30 hidden w-[min(100%,20rem)] flex-col border-r border-moss/10 bg-white/95 shadow-[8px_0_32px_rgba(20,32,28,0.12)] backdrop-blur-md transition-transform duration-300 ease-out md:flex ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!sidebarOpen}
        >
          <div className="shrink-0 px-5 pb-4 pt-6">
            <button
              type="button"
              onClick={resetToHome}
              className="relative z-40 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink transition hover:text-moss"
              aria-label="piu.ge — მთავარ გვერდზე დაბრუნება"
            >
              piu.ge
            </button>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold leading-tight text-ink md:text-[1.75rem]">
              რუკაზე იპოვე
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
              დაკარგული, ჩუქდება და ნაპოვნი — კატები და ძაღლები მთელ
              საქართველოში.
            </p>

            <div className="mt-5">
              <FilterFields
                toneFilters={toneFilters}
                animalFilters={animalFilters}
                onTone={onTone}
                onAnimal={onAnimal}
              />
            </div>

            <p className="mt-5 text-[13px] font-medium text-ink-soft">
              რუკაზე: {loading ? "…" : totalMatched} განცხადება
            </p>
          </div>

          <div className="min-h-0 flex-1 border-t border-moss/10">
            <VirtualListingList
              items={items}
              activeId={activeId}
              onSelect={(id) => {
                const item =
                  items.find((listing) => listing.id === id) ??
                  (pinnedListing?.id === id ? pinnedListing : null);
                if (item) applyFocusListing(item, { pan: true });
                else handleSelect(id);
              }}
            />
          </div>
        </aside>

        {/* Collapse / expand tab — same mid-left height in both states */}
        <button
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          className={`pointer-events-auto absolute top-1/2 z-40 hidden -translate-y-1/2 items-center gap-1 border border-moss/15 bg-white/95 py-4 text-ink-soft shadow-[4px_0_20px_rgba(20,32,28,0.12)] backdrop-blur-md transition hover:bg-mist hover:text-ink md:flex ${
            sidebarOpen
              ? "left-[min(100%,20rem)] rounded-r-xl border-l-0 pl-1.5 pr-2.5"
              : "left-0 rounded-r-xl border-l-0 pl-1.5 pr-2.5"
          }`}
          aria-label={sidebarOpen ? "პანელის შეკეცვა" : "პანელის გამოშლა"}
          title={sidebarOpen ? "შეკეცვა" : "გამოშლა"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d={sidebarOpen ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Desktop legend */}
        <div className="pointer-events-auto absolute bottom-8 right-8 hidden md:block">
          <div className="rounded-lg bg-white/92 px-3 py-2.5 text-xs text-ink-soft shadow-md backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-[16px] w-[12px]"
                  style={{ backgroundColor: "#e23a3a", clipPath: PIN_CLIP }}
                />
                დაკარგული
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-[16px] w-[12px]"
                  style={{ backgroundColor: "#e6b422", clipPath: PIN_CLIP }}
                />
                ჩუქდება
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-[16px] w-[12px]"
                  style={{ backgroundColor: "#2f5f45", clipPath: PIN_CLIP }}
                />
                ნაპოვნი
              </span>
            </div>
          </div>
        </div>

        {/* Mobile filter sheet */}
        {filtersOpen ? (
          <div className="pointer-events-auto absolute inset-0 z-40 md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
              aria-label="ფილტრების დახურვა"
              onClick={() => setFiltersOpen(false)}
            />
            <div className="absolute inset-x-0 bottom-0 max-h-[78dvh] overflow-hidden rounded-t-[1.35rem] bg-white shadow-[0_-12px_40px_rgba(20,32,28,0.18)]">
              <div className="flex justify-center pt-3">
                <span className="h-1 w-10 rounded-full bg-moss/20" />
              </div>
              <div className="flex items-center justify-between px-5 pb-2 pt-3">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-ink">
                    ფილტრები
                  </p>
                  <p className="text-xs text-ink-soft">
                    რუკაზე: {loading ? "…" : totalMatched} განცხადება
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="rounded-full bg-paper px-3 py-1.5 text-sm font-semibold text-ink-soft"
                >
                  მზადაა
                </button>
              </div>
              <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2">
                <FilterFields
                  toneFilters={toneFilters}
                  animalFilters={animalFilters}
                  onTone={onTone}
                  onAnimal={onAnimal}
                  dense
                />
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setToneFilters([...ALL_TONES]);
                      setAnimalFilters([...ALL_ANIMALS]);
                      handleSelect(null);
                    }}
                    className="flex-1 rounded-xl border border-moss/15 py-3 text-sm font-semibold text-ink-soft"
                  >
                    გასუფთავება
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="flex-[1.4] rounded-xl bg-moss py-3 text-sm font-semibold text-white"
                  >
                    რუკაზე ნახვა
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Mobile bottom tab bar */}
        <nav
          className="ipove-mobile-tabbar pointer-events-auto absolute inset-x-0 bottom-0 z-30 md:hidden"
          aria-label="მთავარი ნავიგაცია"
        >
          <div className="mx-auto flex max-w-lg items-end justify-between gap-1 px-2 pb-[max(0.45rem,env(safe-area-inset-bottom))] pt-2">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold text-ink-soft"
            >
              <NavIcon>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M7 12h10M10 18h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </NavIcon>
              ფილტრი
              {filtersRestricted ? (
                <span className="absolute right-[22%] top-1 h-2 w-2 rounded-full bg-[#e23a3a]" />
              ) : null}
            </button>

            <Link
              href="/dzieba"
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold text-ink-soft"
            >
              <NavIcon>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20l-3.2-3.2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </NavIcon>
              ძებნა
            </Link>

            <div className="relative flex w-[4.5rem] shrink-0 justify-center">
              <Link
                href="/gancxadeba"
                className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-moss text-white shadow-[0_10px_28px_rgba(31,74,58,0.4)] ring-4 ring-white"
                aria-label="განცხადების დამატება"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
              <span className="mt-8 text-[11px] font-semibold text-ink-soft">
                დამატება
              </span>
            </div>

            <span className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold text-moss">
              <NavIcon>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21s-7-5.8-7-11a7 7 0 1 1 14 0c0 5.2-7 11-7 11z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="10" r="2.4" fill="currentColor" />
                </svg>
              </NavIcon>
              რუკა
            </span>
          </div>
        </nav>
      </div>
    </section>
  );
}
