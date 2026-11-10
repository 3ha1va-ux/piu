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
  const formTopRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);

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

  async function processSelectedFiles(files: File[]) {
    if (files.length === 0) return;
    const imageFiles = files.filter(
      (f) => f.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|avif)$/i.test(f.name)
    );
    if (imageFiles.length === 0) {
      setError("გთხოვთ აირჩიოთ სურათის ფაილები (JPG, PNG, WebP)");
      return;
    }
    const remainingSlots = Math.max(0, 4 - form.photos.length);
    if (remainingSlots <= 0) {
      setError("მაქსიმუმ 4 ფოტოს ატვირთვაა შესაძლებელი");
      return;
    }
    const toProcess = imageFiles.slice(0, remainingSlots);
    setIsProcessingPhotos(true);
    setError(null);
    try {
      const prepared = await Promise.all(toProcess.map((f) => preparePhoto(f)));
      const nextPhotos = [...form.photos, ...prepared].slice(0, 4);
      const hadNone = form.photos.length === 0;
      patch({
        photos: nextPhotos,
        mainPhotoIndex: hadNone
          ? 0
          : Math.min(form.mainPhotoIndex, Math.max(0, nextPhotos.length - 1)),
      });
    } catch (err) {
      console.error("Photo processing error:", err);
      setError("ფოტოს დამუშავება ვერ მოხერხდა. სცადეთ სხვა ფოტო.");
    } finally {
      setIsProcessingPhotos(false);
    }
  }

  async function onPhotosChange(e: ChangeEvent<HTMLInputElement>) {
    const files = [...(e.target.files ?? [])];
    await processSelectedFiles(files);
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

  function scrollToFormTop() {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  }

  function goNext() {
    const message = validateStep(step, form);
    if (message) {
      setError(message);
      scrollToFormTop();
      return;
    }
    setError(null);
    setStep((s) => Math.min(4, s + 1));
    scrollToFormTop();
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
    scrollToFormTop();
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
      ref={formTopRef}
      onSubmit={onSubmit}
      onKeyDown={onFormKeyDown}
      className="w-full scroll-mt-6"
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
          <div className="mt-6 space-y-6">
            {/* Hidden File Inputs */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPhotosChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={onVideoChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* 1. Modern Photo Upload Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <span>ფოტოები *</span>
                  <span className="text-xs font-normal text-[var(--ink-soft)]">
                    ({form.photos.length}/4)
                  </span>
                </label>
                {form.photos.length > 0 && (
                  <span className="text-xs text-[var(--moss)] font-medium">
                    პირველი ფოტო მთავარია
                  </span>
                )}
              </div>

              {/* Upload Dropzone when no photos uploaded yet */}
              {form.photos.length === 0 ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotos(true);
                  }}
                  onDragLeave={() => setIsDraggingPhotos(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotos(false);
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    processSelectedFiles(droppedFiles);
                  }}
                  onClick={() => photoInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition cursor-pointer select-none active:scale-[0.99] touch-manipulation ${
                    isDraggingPhotos
                      ? "border-[var(--moss)] bg-emerald-50/70 ring-4 ring-[var(--moss)]/15"
                      : "border-[var(--mist)] hover:border-[var(--moss)]/60 bg-[var(--paper)]/40 hover:bg-emerald-50/30"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[var(--mist)] flex items-center justify-center text-[var(--moss)] group-hover:scale-105 group-hover:border-[var(--moss)]/40 transition">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="mt-3.5 text-sm sm:text-base font-bold text-[var(--ink)] text-center">
                    ატვირთეთ ფოტოები <span className="text-[var(--moss)] font-semibold">(1–4 ფოტო)</span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--ink-soft)] text-center max-w-sm leading-relaxed">
                    დააჭირეთ ასარჩევად ან ჩააგდეთ ფაილები აქ. პირველი ფოტო ავტომატურად მთავარია.
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[var(--mist)] text-xs font-semibold text-[var(--ink)] shadow-2xs group-hover:border-[var(--moss)]/40">
                      <span>📷</span>
                      <span>ფოტოს არჩევა</span>
                    </span>
                    <span className="text-[11px] text-[var(--ink-soft)] font-medium">
                      JPG, PNG, WebP
                    </span>
                  </div>
                </div>
              ) : (
                /* Thumbnails Grid when photos are already chosen */
                <div>
                  <ul className="flex flex-wrap gap-3 sm:gap-4">
                    {previews.map((src, i) => {
                      const isMain = form.mainPhotoIndex === i;
                      return (
                        <li key={src} className="relative">
                          <button
                            type="button"
                            onClick={() => patch({ mainPhotoIndex: i })}
                            className={`group block overflow-hidden rounded-2xl border-2 transition shadow-xs aspect-square w-24 h-24 sm:w-28 sm:h-28 active:scale-[0.98] touch-manipulation cursor-pointer ${
                              isMain
                                ? "border-[var(--moss)] ring-3 ring-[var(--moss)]/25"
                                : "border-[var(--mist)] hover:border-[var(--moss)]/40 opacity-80 hover:opacity-100"
                            }`}
                            aria-pressed={isMain}
                            aria-label={isMain ? "მთავარი ფოტო" : "მთავარად მონიშვნა"}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {/* Subtle overlay on hover/focus if not main */}
                            {!isMain && (
                              <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] py-1 text-center opacity-0 group-hover:opacity-100 transition">
                                მთავარად არჩევა
                              </span>
                            )}
                          </button>

                          {/* "მთავარი" badge */}
                          {isMain && (
                            <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-lg bg-[var(--moss)] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                              მთავარი ⭐
                            </span>
                          )}

                          {/* High-contrast accessible Delete button */}
                          <button
                            type="button"
                            onClick={() => removePhoto(i)}
                            className="absolute -top-1.5 -right-1.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-stone-900 hover:bg-red-600 text-white shadow-md transition active:scale-90 touch-manipulation"
                            aria-label="ფოტოს წაშლა"
                            title="ფოტოს წაშლა"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </li>
                      );
                    })}

                    {/* "+ დამატება" slot if less than 4 photos */}
                    {form.photos.length < 4 && (
                      <li>
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="flex flex-col items-center justify-center aspect-square w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-[var(--mist)] hover:border-[var(--moss)] bg-[var(--paper)]/50 hover:bg-emerald-50/40 text-[var(--ink-soft)] hover:text-[var(--moss)] transition cursor-pointer active:scale-95 touch-manipulation"
                        >
                          <span className="text-xl font-bold">+</span>
                          <span className="text-[11px] font-semibold mt-0.5">
                            დამატება (+{4 - form.photos.length})
                          </span>
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Compression / Processing Loading State */}
              {isProcessingPhotos && (
                <div className="mt-3 flex items-center justify-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 animate-pulse">
                  <svg className="w-4 h-4 animate-spin text-[var(--moss)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span>ფოტო მუშავდება და ოპტიმიზირდება...</span>
                </div>
              )}
            </div>

            {/* 2. Modern Video Upload Section */}
            <div>
              <label className="text-sm font-bold text-[var(--ink)] block mb-2">
                ვიდეო <span className="font-normal text-xs text-[var(--ink-soft)]">(არასავალდებულო, მაქს. 40MB)</span>
              </label>

              {!form.video ? (
                <div
                  onClick={() => videoInputRef.current?.click()}
                  className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border-2 border-dashed border-[var(--mist)] hover:border-[var(--moss)]/60 bg-[var(--paper)]/30 hover:bg-emerald-50/20 transition cursor-pointer active:scale-[0.99] touch-manipulation select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-[var(--mist)] flex items-center justify-center text-[var(--moss)] group-hover:scale-105 transition">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                        ვიდეოს დამატება
                      </p>
                      <p className="text-[11px] text-[var(--ink-soft)]">
                        მაქსიმუმ 40MB • MP4, MOV, WebM
                      </p>
                    </div>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white border border-[var(--mist)] text-xs font-semibold text-[var(--ink)] shadow-2xs group-hover:border-[var(--moss)]/40 transition">
                    + არჩევა
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white text-emerald-700 shadow-2xs border border-emerald-200 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate">
                        {form.video.name}
                      </p>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        ✓ ვიდეო მზადაა ({(form.video.size / (1024 * 1024)).toFixed(1)} MB)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => patch({ video: null })}
                    className="shrink-0 ml-3 h-9 px-3.5 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition active:scale-95 touch-manipulation"
                  >
                    წაშლა
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-[var(--ink)] block" htmlFor="name">
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
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block" htmlFor="breed">
                  ჯიში
                </label>
                <input
                  id="breed"
                  value={form.breed}
                  onChange={(e) => patch({ breed: e.target.value })}
                  placeholder="მაგ. მეტისი"
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block" htmlFor="age">
                  ასაკი
                </label>
                <input
                  id="age"
                  value={form.age}
                  onChange={(e) => patch({ age: e.target.value })}
                  placeholder="მაგ. 2 წელი / 6 თვე"
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-[var(--ink)] block" htmlFor="sex">
                  სქესი
                </label>
                <select
                  id="sex"
                  value={form.sex}
                  onChange={(e) =>
                    patch({ sex: e.target.value as ListingFormState["sex"] })
                  }
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
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
                <label className="text-sm font-semibold text-[var(--ink)] block" htmlFor="color">
                  ფერი
                </label>
                <input
                  id="color"
                  value={form.color}
                  onChange={(e) => patch({ color: e.target.value })}
                  placeholder="მაგ. შავ-თეთრი"
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
                />
              </div>
              <div>
                <label
                  className="text-sm font-semibold text-[var(--ink)] block"
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
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
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
                  className="text-sm font-semibold text-[var(--ink)] block"
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
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
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
                className="text-sm font-semibold text-[var(--ink)] block"
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
                className="mt-2 w-full resize-y rounded-xl border border-[var(--mist)] bg-white p-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
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
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
              />
              <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                ჩაწერისას გამოჩნდება შემოთავაზებები; არჩევა რუკაზე გადაგიყვანს.
                {placeSearching ? " იძებნება…" : ""}
              </p>
              {showSuggestions && visiblePlaceSuggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-[var(--mist)] bg-white py-1 shadow-xl">
                  {visiblePlaceSuggestions.map((hit) => (
                    <li key={`${hit.source}-${hit.lat}-${hit.lng}-${hit.label}`}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => applyPlaceSuggestion(hit)}
                        className="flex w-full flex-col px-3.5 py-2.5 text-left hover:bg-[var(--paper)] transition"
                      >
                        <span className="text-sm font-semibold text-[var(--ink)]">
                          {hit.label}
                        </span>
                        <span className="text-xs text-[var(--ink-soft)]">{hit.place}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div>
              <label
                className="text-sm font-semibold text-[var(--ink)] block"
                htmlFor="eventDate"
              >
                {eventDateLabel(form.tone)}
              </label>
              <input
                id="eventDate"
                type="date"
                value={form.eventDate}
                onChange={(e) => patch({ eventDate: e.target.value })}
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
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
                className="text-sm font-semibold text-[var(--ink)] block"
                htmlFor="contactName"
              >
                შენი სახელი
              </label>
              <input
                id="contactName"
                value={form.contactName}
                onChange={(e) => patch({ contactName: e.target.value })}
                placeholder="როგორ მოგმართონ"
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
              />
            </div>
            <div>
              <label
                className="text-sm font-semibold text-[var(--ink)] block"
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
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
              />
              <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                ნომერი გამოჩნდება იმ ადამიანებისთვის, ვინც განცხადებას ნახავს.
              </p>
            </div>

            <div>
              <label
                className="text-sm font-semibold text-[var(--ink)] block"
                htmlFor="contactSocial"
              >
                Facebook / Viber / Telegram
              </label>
              <input
                id="contactSocial"
                value={form.contactSocial}
                onChange={(e) => patch({ contactSocial: e.target.value })}
                placeholder="ლინკი ან სახელი / ნომერი"
                className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
              />
            </div>

            {form.tone === "lost" ? (
              <div>
                <label
                  className="text-sm font-semibold text-[var(--ink)] block"
                  htmlFor="reward"
                >
                  ჯილდო{" "}
                  <span className="font-normal text-xs text-[var(--ink-soft)]">(თუ არის)</span>
                </label>
                <input
                  id="reward"
                  value={form.reward}
                  onChange={(e) => patch({ reward: e.target.value })}
                  placeholder="მაგ. 200 ლარი / მადლობა"
                  className="mt-2 w-full h-11 rounded-xl border border-[var(--mist)] bg-white px-3.5 text-base sm:text-sm text-[var(--ink)] outline-none focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 transition"
                />
              </div>
            ) : null}

            <div className="rounded-2xl bg-[var(--paper)]/60 border border-[var(--mist)]/70 p-4 text-sm text-[var(--ink-soft)]">
              <p className="font-bold text-[var(--ink)] mb-2 flex items-center gap-1.5">
                <span>📋</span>
                <span>მონაცემების შემოწმება</span>
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">ტიპი:</span>
                  <span>{form.tone ? TONE_LABELS[form.tone] : "—"} · {form.animal ?? "—"} · {form.name.trim() || "სახელის გარეშე"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">ადგილი:</span>
                  <span className="truncate">{form.place || "მონიშნულია რუკაზე"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-semibold text-[var(--ink)]">მედია:</span>
                  <span>
                    {form.photos.length} ფოტო
                    {form.video ? " · 1 ვიდეო" : ""}
                    {form.reward.trim() ? ` · ჯილდო: ${form.reward.trim()}` : ""}
                  </span>
                </li>
              </ul>
            </div>

            {user ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-xs sm:text-sm text-emerald-800">
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
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3.5 text-xs sm:text-sm text-amber-900">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>გამოქვეყნებამდე საჭიროა ავტორიზაცია</span>
                </div>
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="shrink-0 min-h-[36px] rounded-xl bg-[var(--moss)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--leaf)] transition active:scale-95 touch-manipulation"
                >
                  შესვლა
                </button>
              </div>
            )}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 animate-in fade-in"
          >
            <svg className="w-4 h-4 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        ) : null}

        <div className="mt-8 pt-6 border-t border-[var(--mist)]/70 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 h-12 rounded-xl border border-[var(--mist)] bg-white px-5 text-xs sm:text-sm font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition active:scale-[0.98] touch-manipulation"
            >
              <span>←</span>
              <span>უკან</span>
            </button>
          ) : (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 h-12 rounded-xl border border-transparent px-3 text-xs sm:text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition active:scale-[0.98] touch-manipulation"
            >
              <span>←</span>
              <span>რუკაზე დაბრუნება</span>
            </Link>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-2 h-12 rounded-xl bg-[var(--moss)] px-7 text-xs sm:text-sm font-bold text-white shadow-md shadow-[var(--moss)]/20 transition hover:bg-[var(--leaf)] active:scale-[0.98] touch-manipulation"
            >
              <span>შემდეგი</span>
              <span>→</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 h-12 rounded-xl bg-[var(--moss)] px-7 text-xs sm:text-sm font-bold text-white shadow-md shadow-[var(--moss)]/20 transition hover:bg-[var(--leaf)] disabled:opacity-60 active:scale-[0.98] touch-manipulation"
            >
              {submitting ? "იგზავნება…" : "🚀 განცხადების გამოქვეყნება"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
