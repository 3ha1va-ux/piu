"use client";

import { useState } from "react";
import Link from "next/link";
import PosterModal from "@/components/PosterModal";
import type { PetListing } from "@/data/listings-types";
import { markerVisual, toneColor } from "@/lib/markerStyles";

function formatDate(raw?: string): string | null {
  if (!raw) return null;
  const d = raw.slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

export default function ListingDetailView({ listing }: { listing: PetListing }) {
  const [posterOpen, setPosterOpen] = useState(false);
  const photos = listing.photoUrls ?? [];
  const [index, setIndex] = useState(() =>
    Math.min(
      Math.max(0, listing.mainPhotoIndex ?? 0),
      Math.max(0, (listing.photoUrls?.length ?? 1) - 1),
    ),
  );
  const visual = markerVisual(listing.animal, listing.tone);
  const main = photos[index] ?? photos[0] ?? null;
  const eventLabel = formatDate(listing.eventDate);
  const createdLabel = formatDate(listing.createdAt);

  return (
    <article className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-moss/10 bg-white shadow-[0_16px_48px_rgba(20,32,28,0.08)]">
          {main ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={main}
              alt={listing.name}
              className="h-[320px] w-full object-cover md:h-[420px]"
            />
          ) : (
            <div className="flex h-[280px] items-center justify-center bg-mist text-moss">
              ფოტო არ არის
            </div>
          )}
          {photos.length > 1 ? (
            <div className="grid grid-cols-4 gap-2 p-3">
              {photos.slice(0, 4).map((src, i) => (
                <button
                  key={`${listing.id}-${src}-${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`overflow-hidden rounded-lg border-2 ${
                    i === index
                      ? "border-moss"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-moss/10 bg-white/95 p-6 shadow-[0_16px_48px_rgba(20,32,28,0.08)] md:p-8">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: toneColor(listing.tone) }}
        >
          {visual.caption}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
          {listing.name}
        </h1>
        <p className="mt-2 text-lg text-ink-soft">{listing.place}</p>

        {listing.description ? (
          <p className="mt-5 leading-relaxed text-ink-soft">
            {listing.description}
          </p>
        ) : (
          <p className="mt-5 text-sm text-ink-soft">
            დეტალური აღწერა ამ განცხადებაზე ჯერ არ არის მითითებული.
          </p>
        )}

        <dl className="mt-6 space-y-3 border-t border-moss/10 pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">ცხოველი</dt>
            <dd className="font-medium text-ink">{listing.animal}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">სტატუსი</dt>
            <dd className="font-medium text-ink">{listing.kind}</dd>
          </div>
          {listing.breed ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ჯიში</dt>
              <dd className="font-medium text-ink">{listing.breed}</dd>
            </div>
          ) : null}
          {listing.age ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ასაკი</dt>
              <dd className="font-medium text-ink">{listing.age}</dd>
            </div>
          ) : null}
          {listing.color ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ფერი</dt>
              <dd className="font-medium text-ink">{listing.color}</dd>
            </div>
          ) : null}
          {listing.sex ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">სქესი</dt>
              <dd className="font-medium text-ink">{listing.sex}</dd>
            </div>
          ) : null}
          {listing.hasCollar ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ყელსაბამი</dt>
              <dd className="font-medium text-ink">{listing.hasCollar}</dd>
            </div>
          ) : null}
          {listing.hasChip ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ჩიპი</dt>
              <dd className="font-medium text-ink">{listing.hasChip}</dd>
            </div>
          ) : null}
          {listing.reward ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ჯილდო</dt>
              <dd className="font-medium text-ink">{listing.reward}</dd>
            </div>
          ) : null}
          {eventLabel ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">მოვლენის თარიღი</dt>
              <dd className="font-medium text-ink">{eventLabel}</dd>
            </div>
          ) : null}
          {createdLabel ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">ატვირთვის თარიღი</dt>
              <dd className="font-medium text-ink">{createdLabel}</dd>
            </div>
          ) : null}
          {listing.contactName ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">კონტაქტი</dt>
              <dd className="font-medium text-ink">{listing.contactName}</dd>
            </div>
          ) : null}
          {listing.contactSocial ? (
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Facebook / Viber</dt>
              <dd className="max-w-[60%] break-all text-right font-medium text-ink">
                {listing.contactSocial}
              </dd>
            </div>
          ) : null}
        </dl>

        {listing.videoUrl ? (
          <video
            controls
            className="mt-5 w-full rounded-xl bg-black"
            src={listing.videoUrl}
          />
        ) : null}

        {listing.contactPhone ? (
          <a
            href={`tel:${listing.contactPhone}`}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-moss px-5 font-semibold text-white transition hover:bg-leaf"
          >
            დარეკვა · {listing.contactPhone}
          </a>
        ) : null}

        <div className="mt-3 flex gap-2">
          <Link
            href={`/?focus=${encodeURIComponent(listing.id)}`}
            onClick={() => {
              try {
                sessionStorage.setItem("ipove-map-focus", listing.id);
              } catch {
                /* ignore */
              }
            }}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-moss/20 bg-white px-4 text-xs sm:text-sm font-semibold text-ink transition hover:bg-paper"
          >
            რუკაზე ნახვა
          </Link>
          <button
            type="button"
            onClick={() => setPosterOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-moss/20 bg-white px-4 text-xs sm:text-sm font-semibold text-ink transition hover:bg-paper"
            title="სამძებრო პოსტერის ამობეჭდვა"
          >
            <span>🖹</span>
            <span>პოსტერი</span>
          </button>
        </div>

        <p className="mt-5 text-xs text-ink-soft">
          კოორდინატები: {listing.lat.toFixed(5)}, {listing.lng.toFixed(5)}
        </p>

        {posterOpen && (
          <PosterModal listing={listing} onClose={() => setPosterOpen(false)} />
        )}
      </div>
    </article>
  );
}
