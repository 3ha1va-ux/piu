"use client";

import { useState, useEffect } from "react";
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
  const [copied, setCopied] = useState(false);
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

  // Record listing view once per browser session
  useEffect(() => {
    if (!listing?.id) return;
    const sessionKey = `viewed_${listing.id}`;
    if (typeof window !== "undefined") {
      try {
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "1");
          fetch("/api/listings/view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: listing.id }),
          }).catch(() => {});
        }
      } catch {
        // ignore
      }
    }
  }, [listing?.id]);

  const shareUrl = `https://piu.ge/gancxadeba/${encodeURIComponent(listing.id)}`;

  const handleCopyLink = async () => {
    try {
      const urlToCopy =
        typeof window !== "undefined" && window.location.hostname !== "localhost"
          ? `${window.location.origin}/gancxadeba/${encodeURIComponent(listing.id)}`
          : shareUrl;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const tonePrefix =
    listing.tone === "lost"
      ? "დაიკარგა"
      : listing.tone === "found"
      ? "ნაპოვნია"
      : "ჩუქდება";
  const shareText = `🚨 ${tonePrefix} ${listing.animal} "${listing.name || "უცნობი"}" (${listing.place})! გთხოვთ დაგვეხმაროთ პოვნაში:`;

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

        {/* Google Maps Turn-by-Turn Navigation */}
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${listing.lat},${listing.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-semibold text-xs sm:text-sm transition shadow-xs group"
          title="Google Maps-ში ნავიგაცია თქვენი მდებარეობიდან"
        >
          <svg className="w-5 h-5 text-[#4285F4] shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
          <span>Google Maps-ით მისვლა (ნავიგაცია)</span>
          <span className="text-xs text-blue-600 font-normal">↗</span>
        </a>

        {/* Social Viral Share Section */}
        <div className="mt-5 rounded-2xl bg-white p-4 border border-moss/10 shadow-xs space-y-2.5">
          <p className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
            <span>📢</span>
            <span>გააზიარეთ სოციალურ ქსელებში — დაეხმარეთ პოვნაში!</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Facebook Share */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1877F2] text-white text-xs font-semibold hover:opacity-90 transition shadow-xs"
              title="Facebook-ზე გაზიარება"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>

            {/* Viber */}
            <a
              href={`viber://forward?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7360F2] text-white text-xs font-semibold hover:opacity-90 transition shadow-xs"
              title="Viber-ში გაგზავნა"
            >
              <span>🟣 Viber</span>
            </a>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:opacity-90 transition shadow-xs"
              title="WhatsApp-ში გაგზავნა"
            >
              <span>🟢 WhatsApp</span>
            </a>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] text-[var(--ink)] text-xs font-medium transition"
            >
              <span>{copied ? "✓ დაკოპირდა!" : "🔗 ლინკის კოპირება"}</span>
            </button>
          </div>
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
