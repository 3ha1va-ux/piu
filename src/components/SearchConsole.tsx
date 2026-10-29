"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  AnimalType,
  ListingSort,
  ListingTone,
  PetListing,
} from "@/data/listings-types";
import { listingIconUrl } from "@/lib/listingMedia";
import { markerVisual, TONE_COLORS, TONE_LABELS } from "@/lib/markerStyles";

const TONE_OPTIONS: ListingTone[] = ["lost", "gift", "found"];
const ANIMAL_OPTIONS: AnimalType[] = ["ძაღლი", "კატა"];

const SORT_OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "created_desc", label: "ატვირთვა: ახალი → ძველი" },
  { value: "created_asc", label: "ატვირთვა: ძველი → ახალი" },
  { value: "event_desc", label: "მოვლენის თარიღი: ახალი → ძველი" },
  { value: "event_asc", label: "მოვლენის თარიღი: ძველი → ახალი" },
];

export type PlaceSuggestion = {
  label: string;
  place: string;
  lat: number;
  lng: number;
  zoom: number;
  bbox?: [number, number, number, number];
  source: "local" | "osm";
};

type SearchConsoleProps = {
  variant?: "page" | "map";
  onSelectListing?: (listing: PetListing) => void;
  onSelectPlace?: (place: PlaceSuggestion) => void;
};

function formatDate(raw?: string): string | null {
  if (!raw) return null;
  const d = raw.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

export default function SearchConsole({
  variant = "page",
  onSelectListing,
  onSelectPlace,
}: SearchConsoleProps) {
  const [q, setQ] = useState("");
  const [tones, setTones] = useState<ListingTone[]>([]);
  const [animals, setAnimals] = useState<AnimalType[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<ListingSort>("created_desc");
  const [expanded, setExpanded] = useState(variant === "page");
  const [items, setItems] = useState<PetListing[]>([]);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isMap = variant === "map";
  const showPanel = expanded || !isMap;

  const digits = q.replace(/\D/g, "");
  const hasQuery = q.trim().length >= 2 || digits.length >= 3;
  const hasFilter =
    tones.length > 0 || animals.length > 0 || Boolean(dateFrom || dateTo);
  const canSearch = hasQuery || hasFilter;
  const placeQuery = q.trim();
  const placesQueryActive = isMap && placeQuery.length >= 2;
  const visiblePlaces = placesQueryActive ? places : [];
  const visibleItems = canSearch ? items : [];
  const visibleTotal = canSearch ? total : 0;
  const visibleSearched = canSearch && searched;
  const showPlacesLoading = placesQueryActive && placesLoading;
  const showMapResults =
    isMap &&
    showPanel &&
    (visibleSearched ||
      loading ||
      showPlacesLoading ||
      visiblePlaces.length > 0);

  useEffect(() => {
    if (!isMap) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isMap]);

  // Place / location suggestions for map (Google Maps-like)
  useEffect(() => {
    if (!isMap) return;
    if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
    const query = q.trim();
    if (query.length < 2) return;

    const ac = new AbortController();
    placeDebounceRef.current = setTimeout(async () => {
      setPlacesLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: PlaceSuggestion[] };
        setPlaces(data.results ?? []);
      } catch {
        if (!ac.signal.aborted) setPlaces([]);
      } finally {
        if (!ac.signal.aborted) setPlacesLoading(false);
      }
    }, 220);
    return () => {
      ac.abort();
      if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
    };
  }, [q, isMap]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const digitsInner = q.replace(/\D/g, "");
    const hasQueryInner = q.trim().length >= 2 || digitsInner.length >= 3;
    const hasFilterInner =
      tones.length > 0 || animals.length > 0 || Boolean(dateFrom || dateTo);
    if (!hasQueryInner && !hasFilterInner) return;

    const ac = new AbortController();
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const params = new URLSearchParams();
        if (hasQueryInner) params.set("q", q.trim());
        if (tones.length) params.set("tones", tones.join(","));
        if (animals.length) params.set("animals", animals.join(","));
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("sort", sort);
        const res = await fetch(`/api/listings/search?${params.toString()}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          total: number;
          items: PetListing[];
        };
        setItems(data.items);
        setTotal(data.total);
      } catch {
        /* ignore abort / network */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 280);

    return () => {
      ac.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, tones, animals, dateFrom, dateTo, sort]);

  function toggleTone(tone: ListingTone) {
    setTones((prev) =>
      prev.includes(tone) ? prev.filter((t) => t !== tone) : [...prev, tone],
    );
  }

  function toggleAnimal(animal: AnimalType) {
    setAnimals((prev) =>
      prev.includes(animal)
        ? prev.filter((a) => a !== animal)
        : [...prev, animal],
    );
  }

  function handleSelect(item: PetListing) {
    onSelectListing?.(item);
    if (isMap) setExpanded(false);
  }

  function handleSelectPlace(place: PlaceSuggestion) {
    onSelectPlace?.(place);
    setQ(place.label);
    setExpanded(false);
    setPlaces([]);
  }

  const placesList =
    isMap && (visiblePlaces.length > 0 || showPlacesLoading) ? (
      <div className="mb-3">
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
          ადგილები
        </p>
        {showPlacesLoading && visiblePlaces.length === 0 ? (
          <p className="text-sm text-ink-soft">ადგილები იძებნება…</p>
        ) : null}
        <ul className="space-y-1">
          {visiblePlaces.map((place) => (
            <li key={`${place.source}-${place.lat}-${place.lng}-${place.label}`}>
              <button
                type="button"
                onClick={() => handleSelectPlace(place)}
                className="flex w-full items-start gap-3 rounded-xl border border-moss/10 bg-white px-3 py-2.5 text-left transition hover:border-moss/30 hover:bg-paper"
              >
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-moss"
                  aria-hidden
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 21s-7-5.8-7-11a7 7 0 1 1 14 0c0 5.2-7 11-7 11z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="10" r="2.2" fill="currentColor" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {place.label}
                  </span>
                  <span className="block truncate text-xs text-ink-soft">
                    {place.place}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const resultsList = (
    <>
      {placesList}
      {loading ? <p className="text-sm text-ink-soft">განცხადებები იძებნება…</p> : null}
      {visibleSearched && !loading ? (
        <p className="mb-2 text-xs text-ink-soft">
          განცხადებები: {visibleTotal}
          {visibleTotal > visibleItems.length
            ? ` · ჩანს ${visibleItems.length}`
            : ""}
        </p>
      ) : null}

      <ul className={`space-y-2 ${isMap ? "max-h-64 overflow-y-auto" : ""}`}>
        {visibleItems.map((item) => {
          const visual = markerVisual(item.animal, item.tone);
          const eventLabel = formatDate(item.eventDate);
          const createdLabel = formatDate(item.createdAt);
          const icon = listingIconUrl(item);
          const content = (
            <>
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={icon}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: visual.color }}
                >
                  {visual.label}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: visual.color }}
                >
                  {visual.caption}
                </p>
                <p className="truncate font-[family-name:var(--font-display)] text-base font-semibold text-ink">
                  {item.name}
                </p>
                <p className="truncate text-sm text-ink-soft">{item.place}</p>
                <div className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-ink-soft">
                  {eventLabel ? <span>მოვლენა: {eventLabel}</span> : null}
                  {createdLabel ? <span>ატვირთვა: {createdLabel}</span> : null}
                  {item.contactPhone ? <span>{item.contactPhone}</span> : null}
                </div>
              </div>
            </>
          );

          return (
            <li key={item.id}>
              {onSelectListing ? (
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex w-full gap-3 rounded-xl border border-moss/10 bg-white p-2.5 text-left transition hover:border-moss/30 hover:bg-paper"
                >
                  {content}
                </button>
              ) : (
                <div className="flex gap-3 rounded-xl border border-moss/10 bg-white p-2.5">
                  {content}
                  <div className="flex shrink-0 flex-col items-end gap-1 self-center">
                    <Link
                      href={`/gancxadeba/${encodeURIComponent(item.id)}`}
                      className="text-sm font-semibold text-moss hover:text-leaf"
                    >
                      ვრცლად
                    </Link>
                    <Link
                      href={`/?focus=${encodeURIComponent(item.id)}`}
                      className="text-xs font-medium text-ink-soft hover:text-ink"
                    >
                      რუკა
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {visibleSearched && !loading && visibleItems.length === 0 ? (
        <p className="rounded-xl bg-paper px-3 py-4 text-center text-sm text-ink-soft">
          ამ მოთხოვნით განცხადება ვერ მოიძებნა.
        </p>
      ) : null}
    </>
  );

  return (
    <div
      ref={rootRef}
      className={
        isMap ? "w-full md:w-[min(100vw-2rem,22rem)]" : "mx-auto w-full max-w-3xl"
      }
    >
      <div
        className={`border border-moss/10 bg-white/95 shadow-[0_16px_40px_rgba(20,32,28,0.14)] backdrop-blur-md ${
          isMap ? "rounded-2xl md:rounded-xl" : "rounded-2xl"
        }`}
      >
        <div className={isMap ? "p-2.5 md:p-3" : "p-5 md:p-7"}>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <span
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
                aria-hidden
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M20 20l-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  if (isMap) setExpanded(true);
                }}
                onFocus={() => {
                  if (isMap) setExpanded(true);
                }}
                placeholder={
                  isMap
                    ? "ადგილი, სახელი, ტელეფონი…"
                    : "სახელი, ტელეფონი, მისამართი…"
                }
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !isMap) return;
                  e.preventDefault();
                  if (places[0]) handleSelectPlace(places[0]);
                }}
                className="w-full rounded-xl border border-moss/15 bg-white py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-moss md:rounded-lg"
              />
            </div>
            {isMap ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="hidden shrink-0 rounded-lg border border-moss/15 px-2.5 py-2.5 text-xs font-semibold text-ink-soft transition hover:bg-paper md:inline-flex"
                aria-expanded={expanded}
              >
                {expanded ? "დახურვა" : "ფილტრი"}
              </button>
            ) : null}
          </div>

          {showPanel ? (
            <div
              className={`mt-4 space-y-4 ${
                isMap
                  ? "hidden border-t border-moss/10 pt-3 md:block"
                  : ""
              }`}
            >
              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  სტატუსი
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TONE_OPTIONS.map((tone) => {
                    const on = tones.includes(tone);
                    return (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => toggleTone(tone)}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          on
                            ? "bg-moss text-white"
                            : "bg-paper text-ink-soft hover:text-ink"
                        }`}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: TONE_COLORS[tone].pin }}
                        />
                        {TONE_LABELS[tone]}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  ცხოველი
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ANIMAL_OPTIONS.map((animal) => {
                    const on = animals.includes(animal);
                    return (
                      <button
                        key={animal}
                        type="button"
                        onClick={() => toggleAnimal(animal)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          on
                            ? "bg-moss text-white"
                            : "bg-paper text-ink-soft hover:text-ink"
                        }`}
                      >
                        {animal}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  პერიოდი
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block text-xs text-ink-soft">
                    დან
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="mt-1 w-full rounded-md border border-moss/15 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-moss"
                    />
                  </label>
                  <label className="block text-xs text-ink-soft">
                    მდე
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="mt-1 w-full rounded-md border border-moss/15 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-moss"
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  დალაგება
                </legend>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ListingSort)}
                  className="mt-2 w-full rounded-md border border-moss/15 bg-white px-2 py-2 text-sm text-ink outline-none focus:border-moss"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-ink-soft">
                  ატვირთვა = როდის დაემატა საიტზე · მოვლენა = დაკარგვის /
                  ნაპოვნის / ჩუქების თარიღი
                </p>
              </fieldset>

              <p className="text-[11px] leading-relaxed text-ink-soft">
                შეგიძლია მოძებნო სახელით, ტელეფონით, მისამართით, აღწერით ან
                თარიღით.
              </p>
            </div>
          ) : null}
        </div>

        {showMapResults ? (
          <div className="max-h-[min(50dvh,22rem)] overflow-y-auto border-t border-moss/10 p-3 md:max-h-none">
            {resultsList}
          </div>
        ) : null}
      </div>

      {!isMap && visibleSearched ? (
        <div className="mt-6">{resultsList}</div>
      ) : null}
    </div>
  );
}
