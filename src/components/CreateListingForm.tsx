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
import { useUserAuth } from "@/lib/userAuthContext";
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
  const { user, openAuthModal, logout } = useUserAuth();
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
  const animalSectionRef = useRef<HTMLDivElement>(null);

  function handleToneSelect(tone: ListingTone) {
    if (form.tone === tone) {
      // Toggle off / deselect
      patch({ tone: null });
      return;
    }
    patch({ tone });
    setError(null);
  }

  function handleAnimalSelect(animal: (typeof ANIMAL_OPTIONS)[number]) {
    if (form.animal === animal) {
      // Toggle off / deselect
      patch({ animal: null });
      return;
    }
    patch({ animal });
    setError(null);
  }

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

    if (!user) {
      setError("განცხადების გამოსაქვეყნებლად და სპამისგან დასაცავად საჭიროა ავტორიზაცია.");
      openAuthModal();
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.set("userId", user.id);
      body.set("userEmail", user.email);
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
      className="w-full"
    >
      {/* Modern Stepper Progress Bar */}
      <div className="mb-6 grid grid-cols-4 gap-2 sm:gap-3">
        {FORM_STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-center sm:justify-start gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl border text-xs sm:text-sm transition ${
                active
                  ? "bg-[var(--moss)] text-white border-[var(--moss)] shadow-xs font-semibold"
                  : done
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-medium"
                  : "bg-white/80 text-[var(--ink-soft)] border-[var(--mist)] font-normal"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  active
                    ? "bg-white text-[var(--moss)]"
                    : done
                    ? "bg-emerald-600 text-white"
                    : "bg-[var(--mist)] text-[var(--ink-soft)]"
                }`}
              >
                {done ? "✓" : item.id}
              </span>
              <span className="hidden sm:inline truncate">{item.title}</span>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-[var(--mist)] bg-white p-6 sm:p-8 shadow-xl">
        <div className="border-b border-[var(--mist)]/70 pb-5 mb-7">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--moss)]">
            ნაბიჯი {step} / 4
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mt-1 font-[family-name:var(--font-display)]">
            {FORM_STEPS[step - 1]?.title}: {FORM_STEPS[step - 1]?.hint}
          </h2>
        </div>

        {step === 1 ? (
          <div className="space-y-8">
            {/* 1. Status Selection */}
            <div role="group" aria-labelledby="status-heading">
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="status-heading" className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--moss)]/15 text-[var(--moss)] text-xs font-bold">1</span>
                    <span>განცხადების სტატუსი *</span>
                  </h3>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    რა შემთხვევაა? აირჩიეთ ერთ-ერთი
                  </p>
                </div>
                {form.tone && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <span>✓</span>
                    <span>{TONE_LABELS[form.tone]}</span>
                  </span>
                )}
              </div>

              <div className="mt-3.5 grid gap-3 sm:grid-cols-3">
                {TONE_OPTIONS.map((tone) => {
                  const selected = form.tone === tone;
                  const isLost = tone === "lost";
                  const isFound = tone === "found";

                  const meta = isLost
                    ? {
                        title: "დაკარგული",
                        subtitle: "ვეძებ ჩემს ცხოველს",
                        dot: "bg-red-500",
                      }
                    : isFound
                    ? {
                        title: "ნაპოვნი",
                        subtitle: "ვიპოვე / შევიფარე",
                        dot: "bg-emerald-500",
                      }
                    : {
                        title: "ჩუქდება",
                        subtitle: "ვეძებ ახალ პატრონს",
                        dot: "bg-amber-500",
                      };

                  return (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => handleToneSelect(tone)}
                      className={`group relative flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.98] touch-manipulation cursor-pointer select-none ${
                        selected
                          ? "border-[var(--moss)] bg-emerald-50/70 shadow-sm ring-2 ring-[var(--moss)]/20"
                          : "border-[var(--mist)] bg-white hover:border-[var(--moss)]/40 hover:bg-[var(--paper)]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <span className={`h-3 w-3 rounded-full shrink-0 shadow-xs ${meta.dot}`} />
                          <span className="font-bold text-sm sm:text-base text-[var(--ink)]">
                            {meta.title}
                          </span>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold transition ${
                            selected
                              ? "bg-[var(--moss)] text-white shadow-xs"
                              : "border border-[var(--mist)] bg-[var(--paper)] text-transparent group-hover:border-[var(--moss)]/30"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs text-[var(--ink-soft)] font-normal">
                        {meta.subtitle}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subtle Divider between Status and Animal */}
            <div className="border-t border-[var(--mist)]/70"></div>

            {/* 2. Animal Selection */}
            <div
              ref={animalSectionRef}
              role="group"
              aria-labelledby="animal-heading"
              className={`rounded-2xl p-4 sm:p-5 border-2 transition-all duration-300 ${
                form.tone && !form.animal
                  ? "border-amber-400 bg-amber-50/70 ring-4 ring-amber-100/90 shadow-xs"
                  : form.animal
                  ? "border-emerald-200/80 bg-emerald-50/20"
                  : "border-[var(--mist)]/40 bg-[var(--paper)]/25"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="animal-heading" className="text-sm sm:text-base font-bold text-[var(--ink)] flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold transition ${
                        form.animal
                          ? "bg-[var(--moss)] text-white"
                          : form.tone
                          ? "bg-amber-400 text-amber-950 animate-pulse"
                          : "bg-[var(--moss)]/15 text-[var(--moss)]"
                      }`}
                    >
                      2
                    </span>
                    <span>ცხოველის სახეობა *</span>
                  </h3>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    ვის ეხება თქვენი განცხადება?
                  </p>
                </div>
                {form.animal && (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in">
                    <span>✓</span>
                    <span>{form.animal}</span>
                  </span>
                )}
              </div>

              <div className="mt-3.5 grid grid-cols-2 gap-3 sm:gap-4">
                {ANIMAL_OPTIONS.map((animal) => {
                  const selected = form.animal === animal;
                  const isDog = animal === "ძაღლი";
                  return (
                    <button
                      key={animal}
                      type="button"
                      onClick={() => handleAnimalSelect(animal)}
                      className={`group relative flex items-center justify-between rounded-2xl border-2 p-4 sm:p-5 text-left transition-all active:scale-[0.98] touch-manipulation cursor-pointer select-none ${
                        selected
                          ? "border-[var(--moss)] bg-emerald-50/70 shadow-sm ring-2 ring-[var(--moss)]/20"
                          : "border-[var(--mist)] bg-white hover:border-[var(--moss)]/40 hover:bg-[var(--paper)]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-3xl sm:text-4xl">
                          {isDog ? "🐶" : "🐱"}
                        </span>
                        <div>
                          <span className="font-bold text-sm sm:text-base text-[var(--ink)] block">
                            {animal}
                          </span>
                          <span className="text-[11px] sm:text-xs text-[var(--ink-soft)] font-normal">
                            {isDog ? "ძაღლის შესახებ" : "კატის შესახებ"}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          selected
                            ? "bg-[var(--moss)] text-white shadow-xs"
                            : "border border-[var(--mist)] bg-[var(--paper)] text-transparent group-hover:border-[var(--moss)]/30"
                        }`}
                      >
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
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

            {user ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs sm:text-sm text-emerald-800">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span>ავტორიზებული ხართ: <strong>{user.email}</strong></span>
                    <span className="mt-0.5 block text-[11px] text-emerald-700">
                      🔒 თქვენი ელფოსტა კონფიდენციალურია და საიტზე საჯაროდ არასდროს ჩანს
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="shrink-0 text-xs text-emerald-800 hover:text-emerald-950 underline font-medium transition"
                  title="სხვა ანგარიშით შესვლა"
                >
                  გამოსვლა
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs sm:text-sm text-amber-900">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>გამოქვეყნებამდე საჭიროა ავტორიზაცია</span>
                </div>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="shrink-0 rounded-lg bg-moss px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf transition"
                >
                  შესვლა
                </button>
              </div>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </p>
        ) : null}

        <div className="mt-8 pt-6 border-t border-[var(--mist)]/70 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mist)] bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition"
            >
              <span>←</span>
              <span>უკან</span>
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-3 py-2 text-xs sm:text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition"
            >
              <span>←</span>
              <span>რუკაზე დაბრუნება</span>
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--moss)] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[var(--leaf)] active:scale-[0.98]"
            >
              <span>შემდეგი</span>
              <span>→</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--moss)] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[var(--leaf)] disabled:opacity-60"
            >
              {submitting ? "იგზავნება…" : "🚀 განცხადების გამოქვეყნება"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
