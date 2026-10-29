"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ListingTone } from "@/data/listings-types";
import { TONE_COLORS, TONE_LABELS } from "@/lib/markerStyles";
import {
  emptyListingForm,
  FORM_STEPS,
  marksFieldLabel,
  placeFieldLabel,
  preparePhoto,
  TRI_STATE_OPTIONS,
  validateStep,
  type ListingFormState,
} from "@/lib/listingForm";

type PlaceSuggestion = {
  label: string;
  place: string;
  lat: number;
  lng: number;
  source: "local" | "osm";
};

const LocationPickerMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#d8e6df] text-sm text-moss">
      რუკა იტვირთება…
    </div>
  ),
});

const TONE_OPTIONS: ListingTone[] = ["lost", "gift", "found"];
const ANIMAL_OPTIONS = ["ძაღლი", "კატა"] as const;
const SEX_OPTIONS = ["მამალი", "მდედრი", "უცნობი"] as const;

function eventDateLabel(tone: ListingTone | null): string {
  if (tone === "lost") return "დაკარგვის თარიღი *";
  if (tone === "found") return "როდის იპოვე";
  return "როდიდან ჩუქდება";
}

export default function CreateListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormState>(() => emptyListingForm());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const previews = useMemo(
    () => form.photos.map((file) => URL.createObjectURL(file)),
    [form.photos],
  );
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>(
    [],
  );
  const [placeSearching, setPlaceSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const placeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipGeocodeRef = useRef(false);
  const placeQuery = form.place.trim();
  const visiblePlaceSuggestions =
    placeQuery.length >= 2 ? placeSuggestions : [];

  useEffect(() => {
    return () => {
      for (const url of previews) URL.revokeObjectURL(url);
    };
  }, [previews]);

  useEffect(() => {
    if (skipGeocodeRef.current) {
      skipGeocodeRef.current = false;
      return;
    }
    if (step !== 3) return;
    const q = form.place.trim();
    if (q.length < 2) return;
    if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
    const ac = new AbortController();
    placeDebounceRef.current = setTimeout(async () => {
      setPlaceSearching(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { results: PlaceSuggestion[] };
        setPlaceSuggestions(data.results ?? []);
        setShowSuggestions(true);
      } catch {
        /* ignore abort / network */
      } finally {
        setPlaceSearching(false);
      }
    }, 320);
    return () => {
      ac.abort();
      if (placeDebounceRef.current) clearTimeout(placeDebounceRef.current);
    };
  }, [form.place, step]);

  function patch(partial: Partial<ListingFormState>) {
    setForm((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function applyPlaceSuggestion(hit: PlaceSuggestion) {
    skipGeocodeRef.current = true;
    setShowSuggestions(false);
    setPlaceSuggestions([]);
    patch({
      place: hit.place,
      lat: hit.lat,
      lng: hit.lng,
    });
  }

  function onFormKeyDown(e: KeyboardEvent<HTMLFormElement>) {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    if (step < 4) {
      e.preventDefault();
      goNext();
    }
  }

  async function onPhotosChange(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])].slice(0, 4);
    if (files.length === 0) return;
    const prepared = await Promise.all(files.map((f) => preparePhoto(f)));
    const nextPhotos = [...form.photos, ...prepared].slice(0, 4);
    const hadNone = form.photos.length === 0;
    patch({
      photos: nextPhotos,
      mainPhotoIndex: hadNone
        ? 0
        : Math.min(form.mainPhotoIndex, Math.max(0, nextPhotos.length - 1)),
    });
    e.target.value = "";
  }

  function removePhoto(index: number) {
    const nextPhotos = form.photos.filter((_, idx) => idx !== index);
    let mainPhotoIndex = form.mainPhotoIndex;
    if (nextPhotos.length === 0) {
      mainPhotoIndex = 0;
    } else if (index === form.mainPhotoIndex) {
      mainPhotoIndex = 0;
    } else if (index < form.mainPhotoIndex) {
      mainPhotoIndex = form.mainPhotoIndex - 1;
    }
    patch({ photos: nextPhotos, mainPhotoIndex });
  }

  function onVideoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 40_000_000) {
      setError("ვიდეო მაქსიმუმ 40MB უნდა იყოს");
      e.target.value = "";
      return;
    }
    patch({ video: file });
    e.target.value = "";
  }

  function goNext() {
    const message = validateStep(step, form);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < 4) {
      goNext();
      return;
    }
    const message = validateStep(4, form);
    if (message) {
      setError(message);
      return;
    }
    if (!form.tone || !form.animal || form.lat == null || form.lng == null) {
      setError("შეავსე ყველა სავალდებულო ველი");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.set("tone", form.tone);
      body.set("animal", form.animal);
      body.set("name", form.name.trim() || "უცნობი");
      body.set("place", form.place.trim());
      body.set("lat", String(form.lat));
      body.set("lng", String(form.lng));
      body.set("description", form.description.trim());
      body.set("color", form.color.trim());
      body.set("breed", form.breed.trim());
      body.set("age", form.age.trim());
      body.set("reward", form.reward.trim());
      body.set("eventDate", form.eventDate);
      body.set("contactPhone", form.contactPhone.trim());
      body.set("contactName", form.contactName.trim());
      body.set("contactSocial", form.contactSocial.trim());
      if (form.sex) body.set("sex", form.sex);
      if (form.hasCollar) body.set("hasCollar", form.hasCollar);
      if (form.hasChip) body.set("hasChip", form.hasChip);
      for (const photo of form.photos) body.append("photos", photo);
      body.set("mainPhotoIndex", String(form.mainPhotoIndex));
      if (form.video) body.set("video", form.video);

      const res = await fetch("/api/listings", { method: "POST", body });
      const data = (await res.json()) as {
        listing?: { id: string };
        error?: string;
      };

      if (!res.ok || !data.listing) {
        setError(data.error ?? "განცხადების შენახვა ვერ მოხერხდა");
        return;
      }

      setDoneId(data.listing.id);
    } catch {
      setError("ქსელის შეცდომა — სცადე თავიდან");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId) {
    return (
      <div className="animate-rise mx-auto max-w-xl rounded-2xl border border-moss/10 bg-white/90 p-8 text-center shadow-[0_16px_48px_rgba(20,32,28,0.1)]">
        <p className="text-sm font-semibold uppercase tracking-wide text-lake">
          მზადაა
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink">
          განცხადება რუკაზეა
        </h2>
        <p className="mt-3 text-ink-soft">
          სხვები უკვე შეძლებენ მის ნახვას იმ ადგილას, რომელიც მონიშნე.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() =>
              router.push(`/?focus=${encodeURIComponent(doneId)}`)
            }
            className="inline-flex h-12 items-center justify-center rounded-md bg-moss px-6 font-semibold text-white transition hover:bg-leaf"
          >
            რუკაზე ნახვა
          </button>
          <button
            type="button"
            onClick={() => {
              setDoneId(null);
              setForm(emptyListingForm());
              setStep(1);
            }}
            className="inline-flex h-12 items-center justify-center rounded-md border border-moss/20 bg-white px-6 font-semibold text-ink transition hover:bg-paper"
          >
            კიდევ ერთის დამატება
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onKeyDown={onFormKeyDown}
      className="mx-auto max-w-3xl"
    >
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {FORM_STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <span
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold ${
                  active
                    ? "bg-moss text-white"
                    : done
                      ? "bg-mist text-moss"
                      : "bg-white text-ink-soft"
                }`}
              >
                {item.id}
              </span>
              <span
                className={`text-sm ${active ? "font-semibold text-ink" : "text-ink-soft"}`}
              >
                {item.title}
              </span>
              {item.id < 4 ? (
                <span className="mx-1 hidden h-px w-6 bg-moss/20 sm:inline-block" />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-moss/10 bg-white/90 p-6 shadow-[0_16px_48px_rgba(20,32,28,0.08)] md:p-8">
        <p className="text-sm text-ink-soft">{FORM_STEPS[step - 1]?.hint}</p>

        {step === 1 ? (
          <div className="mt-6 space-y-8">
            <fieldset>
              <legend className="text-sm font-semibold text-ink">სტატუსი *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {TONE_OPTIONS.map((tone) => {
                  const selected = form.tone === tone;
                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => patch({ tone })}
                      className={`rounded-xl border px-4 py-4 text-left transition ${
                        selected
                          ? "border-moss bg-mist/60 shadow-sm"
                          : "border-moss/15 bg-white hover:border-moss/30"
                      }`}
                    >
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: TONE_COLORS[tone].pin }}
                      />
                      <span className="mt-2 block font-semibold text-ink">
                        {TONE_LABELS[tone]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-ink">სახეობა *</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {ANIMAL_OPTIONS.map((animal) => {
                  const selected = form.animal === animal;
                  return (
                    <button
                      key={animal}
                      type="button"
                      onClick={() => patch({ animal })}
                      className={`rounded-xl border px-4 py-4 text-left font-semibold transition ${
                        selected
                          ? "border-moss bg-mist/60"
                          : "border-moss/15 bg-white hover:border-moss/30"
                      }`}
                    >
                      {animal}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-ink">
                ფოტოები *{" "}
                <span className="font-normal text-ink-soft">(1–4)</span>
              </label>
              <p className="mt-1 text-xs text-ink-soft">
                პირველი ფოტო ავტომატურად მთავარია. სხვაზე დაჭერით შეგიძლია
                მთავარი გადართო — სიაში მისი პატარა იკონი გამოჩნდება.
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPhotosChange}
                className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-moss file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {previews.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-3">
                  {previews.map((src, i) => {
                    const isMain = form.mainPhotoIndex === i;
                    return (
                      <li key={src} className="relative">
                        <button
                          type="button"
                          onClick={() => patch({ mainPhotoIndex: i })}
                          className={`block overflow-hidden rounded-lg ring-2 transition ${
                            isMain
                              ? "ring-moss"
                              : "ring-transparent hover:ring-moss/30"
                          }`}
                          aria-pressed={isMain}
                          aria-label={
                            isMain ? "მთავარი ფოტო" : "მთავარად მონიშვნა"
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-24 w-24 object-cover"
                          />
                        </button>
                        {isMain ? (
                          <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-moss px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            მთავარი
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs text-white"
                          aria-label="წაშლა"
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="video">
                ვიდეო{" "}
                <span className="font-normal text-ink-soft">
                  (არასავალდებულო, მაქს. 40MB)
                </span>
              </label>
              <input
                id="video"
                type="file"
                accept="video/*"
                onChange={onVideoChange}
                className="mt-2 block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-moss file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
              {form.video ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-paper px-3 py-2 text-sm text-ink-soft">
                  <span className="truncate">{form.video.name}</span>
                  <button
                    type="button"
                    onClick={() => patch({ video: null })}
                    className="ml-3 font-semibold text-ink hover:underline"
                  >
                    წაშლა
                  </button>
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-semibold text-ink" htmlFor="name">
                {form.tone === "gift"
                  ? "სახელი *"
                  : "სახელი (თუ აქვს)"}
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder={
                  form.tone === "found" || form.tone === "lost"
                    ? "თუ იცი — ან დატოვე ცარიელი"
                    : "მაგ. ლუკა"
                }
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-moss"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="breed">
                  ჯიში
                </label>
                <input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => patch({ breed: e.target.value })}
                  placeholder="მაგ. მეტისი"
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="age">
                  ასაკი
                </label>
                <input
                  id="age"
                  value={form.age}
                  onChange={(e) => patch({ age: e.target.value })}
                  placeholder="მაგ. 2 წელი / 6 თვე"
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="sex">
                  სქესი
                </label>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) =>
                    patch({ sex: e.target.value as ListingFormState["sex"] })
                  }
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                >
                  <option value="">არ არის მითითებული</option>
                  {SEX_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink" htmlFor="color">
                  ფერი
                </label>
                <input
                  id="color"
                  value={form.color}
                  onChange={(e) => patch({ color: e.target.value })}
                  placeholder="მაგ. შავ-თეთრი"
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="hasCollar"
                >
                  ყელსაბამი
                </label>
                <select
                  id="hasCollar"
                  value={form.hasCollar}
                  onChange={(e) =>
                    patch({
                      hasCollar: e.target
                        .value as ListingFormState["hasCollar"],
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                >
                  <option value="">არ არის მითითებული</option>
                  {TRI_STATE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="hasChip"
                >
                  ჩიპი
                </label>
                <select
                  id="hasChip"
                  value={form.hasChip}
                  onChange={(e) =>
                    patch({
                      hasChip: e.target.value as ListingFormState["hasChip"],
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                >
                  <option value="">არ არის მითითებული</option>
                  {TRI_STATE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="description"
              >
                {marksFieldLabel(form.tone)}
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => patch({ description: e.target.value })}
                rows={4}
                placeholder="ნაწიბური, ყურის ფორმა, ქცევა, სხვა ნიშნები…"
                className="mt-2 w-full resize-y rounded-lg border border-moss/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-moss"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 space-y-5">
            <div className="relative">
              <label className="text-sm font-semibold text-ink" htmlFor="place">
                {placeFieldLabel(form.tone)}
              </label>
              <input
                id="place"
                value={form.place}
                onChange={(e) => {
                  setShowSuggestions(true);
                  patch({ place: e.target.value });
                }}
                onFocus={() => {
                  if (visiblePlaceSuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  window.setTimeout(() => setShowSuggestions(false), 160);
                }}
                autoComplete="off"
                placeholder={
                  form.tone === "lost"
                    ? "მაგ. ავლაბარი · მეტროსთან"
                    : "ჩაწერე უბანი ან ქალაქი — მაგ. ავლაბარი"
                }
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
              />
              <p className="mt-1.5 text-xs text-ink-soft">
                ჩაწერისას გამოჩნდება შემოთავაზებები; არჩევა რუკაზე გადაგიყვანს.
                {placeSearching ? " იძებნება…" : ""}
              </p>
              {showSuggestions && visiblePlaceSuggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-moss/15 bg-white py-1 shadow-lg">
                  {visiblePlaceSuggestions.map((hit) => (
                    <li key={`${hit.source}-${hit.lat}-${hit.lng}-${hit.label}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyPlaceSuggestion(hit)}
                        className="flex w-full flex-col px-3 py-2 text-left hover:bg-paper"
                      >
                        <span className="text-sm font-medium text-ink">
                          {hit.label}
                        </span>
                        <span className="text-xs text-ink-soft">{hit.place}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="eventDate"
              >
                {eventDateLabel(form.tone)}
              </label>
              <input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => patch({ eventDate: e.target.value })}
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-ink">
                მონიშნე ადგილი რუკაზე *
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {form.tone === "lost"
                  ? "მონიშნე წერტილი, სადაც ბოლოს ნახეს ან დაიკარგა."
                  : "აირჩიე შემოთავაზება ან დააჭირე რუკას ზუსტი წერტილისთვის."}
              </p>
              <div className="mt-3 h-72 overflow-hidden rounded-xl border border-moss/15 md:h-96">
                <LocationPickerMap
                  lat={form.lat}
                  lng={form.lng}
                  onPick={(lat, lng) => patch({ lat, lng })}
                />
              </div>
              {form.lat != null && form.lng != null ? (
                <p className="mt-2 text-xs text-ink-soft">
                  მონიშნულია: {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                </p>
              ) : (
                <p className="mt-2 text-xs text-ink-soft">
                  ჯერ წერტილი არ არის მონიშნული
                </p>
              )}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 space-y-5">
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="contactName"
              >
                შენი სახელი
              </label>
              <input
                id="contactName"
                value={form.contactName}
                onChange={(e) => patch({ contactName: e.target.value })}
                placeholder="როგორ მოგმართონ"
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="contactPhone"
              >
                ტელეფონი *
              </label>
              <input
                id="contactPhone"
                type="tel"
                inputMode="tel"
                value={form.contactPhone}
                onChange={(e) => patch({ contactPhone: e.target.value })}
                placeholder="5XX XX XX XX"
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
              />
              <p className="mt-2 text-xs text-ink-soft">
                ნომერი გამოჩნდება იმ ადამიანებისთვის, ვინც განცხადებას ნახავს.
              </p>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-ink"
                htmlFor="contactSocial"
              >
                Facebook / Viber / Telegram
              </label>
              <input
                id="contactSocial"
                value={form.contactSocial}
                onChange={(e) => patch({ contactSocial: e.target.value })}
                placeholder="ლინკი ან სახელი / ნომერი"
                className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
              />
            </div>

            {form.tone === "lost" ? (
              <div>
                <label
                  className="text-sm font-semibold text-ink"
                  htmlFor="reward"
                >
                  ჯილდო{" "}
                  <span className="font-normal text-ink-soft">(თუ არის)</span>
                </label>
                <input
                  id="reward"
                  value={form.reward}
                  onChange={(e) => patch({ reward: e.target.value })}
                  placeholder="მაგ. 200 ლარი / მადლობა"
                  className="mt-2 w-full rounded-lg border border-moss/15 bg-white px-3 py-2.5 outline-none focus:border-moss"
                />
              </div>
            ) : null}

            <div className="rounded-xl bg-paper px-4 py-3 text-sm text-ink-soft">
              <p className="font-semibold text-ink">შემოწმება</p>
              <ul className="mt-2 space-y-1">
                <li>
                  {form.tone ? TONE_LABELS[form.tone] : "—"} · {form.animal ?? "—"} ·{" "}
                  {form.name.trim() || "უცნობი"}
                </li>
                <li>{form.place || "—"}</li>
                <li>
                  {form.photos.length} ფოტო
                  {form.video ? " · ვიდეო" : ""}
                  {form.reward.trim() ? ` · ჯილდო: ${form.reward.trim()}` : ""}
                </li>
              </ul>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-lg bg-[#f7d4d4] px-3 py-2 text-sm text-[#8f2a2a]">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              უკან
            </button>
          ) : (
            <Link
              href="/"
              className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
            >
              რუკაზე დაბრუნება
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-moss px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf"
            >
              შემდეგი
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-moss px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf disabled:opacity-60"
            >
              {submitting ? "იგზავნება…" : "განცხადების გამოქვეყნება"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
