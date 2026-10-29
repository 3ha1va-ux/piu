"use client";

import Image from "next/image";
import type { PetListing } from "@/data/listings-types";

interface PosterModalProps {
  listing: PetListing | null;
  onClose: () => void;
}

export default function PosterModal({ listing, onClose }: PosterModalProps) {
  if (!listing) return null;

  const handlePrint = () => {
    window.print();
  };

  const isLost = listing.tone === "lost";
  const title = isLost ? "დაიკარგა!" : listing.tone === "found" ? "ნაპოვნია!" : "ჩუქდება!";
  const photo =
    listing.photoUrls?.[0] ||
    listing.photoIconUrl ||
    (listing.animal === "ძაღლი" ? "/demo/dog-1.jpg" : "/demo/cat-1.jpg");

  const currentUrl = typeof window !== "undefined"
    ? `${window.location.origin}/gancxadeba/${listing.id}`
    : `https://piu.ge/gancxadeba/${listing.id}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    currentUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--mist)] my-8">
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between pb-4 mb-6 border-b border-[var(--mist)]">
          <div>
            <h3 className="font-display font-bold text-lg text-[var(--ink)]">
              სამძებრო პოსტერი (A4 Flyer)
            </h3>
            <p className="text-xs text-[var(--ink-soft)]">
              მზად არის დასაბეჭდად და ქუჩაში გასაკრავად
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs font-semibold rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>ამობეჭდვა</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-xl hover:bg-[var(--paper)] transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Poster Container */}
        <div className="printable-poster border-4 border-[var(--ink)] p-6 sm:p-8 rounded-2xl text-center bg-white text-[var(--ink)]">
          {/* Main Headline */}
          <div
            className={`py-2 px-6 rounded-xl font-display font-black text-3xl sm:text-5xl tracking-wide uppercase inline-block mb-4 ${
              isLost
                ? "bg-red-600 text-white"
                : listing.tone === "found"
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {title}
          </div>

          {/* Reward Banner */}
          {listing.reward && (
            <div className="mb-4 py-1.5 px-4 bg-amber-400 text-amber-950 font-bold text-lg rounded-xl inline-block">
              🎁 ჯილდო: {listing.reward}
            </div>
          )}

          {/* Big Photo */}
          <div className="mx-auto my-4 w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden border-2 border-[var(--ink)] bg-[var(--paper)] relative">
            <Image
              src={photo}
              alt={listing.name || listing.animal}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          {/* Pet Info */}
          <h2 className="text-2xl sm:text-3xl font-display font-bold mt-2">
            {listing.name || "უცნობი"} ({listing.animal})
          </h2>
          {listing.breed && (
            <p className="text-sm font-semibold text-[var(--ink-soft)] mt-0.5">
              ჯიში: {listing.breed}
            </p>
          )}

          {/* Details Table */}
          <div className="my-4 max-w-md mx-auto text-sm border-t border-b border-gray-300 py-3 grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="font-semibold">ლოკაცია:</span> {listing.place}
            </div>
            {listing.eventDate && (
              <div>
                <span className="font-semibold">თარიღი:</span> {listing.eventDate}
              </div>
            )}
            {listing.color && (
              <div>
                <span className="font-semibold">ფერი:</span> {listing.color}
              </div>
            )}
            {listing.hasCollar === "კი" && (
              <div>
                <span className="font-semibold">საყელური:</span> აქვს
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-xs sm:text-sm text-gray-700 italic max-w-lg mx-auto mb-6">
              „{listing.description}“
            </p>
          )}

          {/* Contact Numbers in Huge Font */}
          <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-300 max-w-lg mx-auto flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wider font-bold text-gray-500">
                დაგვიკავშირდით ნებისმიერ დროს:
              </p>
              <p className="text-2xl sm:text-3xl font-black text-red-600 tracking-wider">
                {listing.contactPhone || "—"}
              </p>
              {listing.contactName && (
                <p className="text-xs text-gray-600 font-medium">{listing.contactName}</p>
              )}
            </div>

            {/* QR Code */}
            <div className="flex-shrink-0 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-16 h-16 sm:w-20 sm:h-20 border border-gray-300 rounded-lg p-0.5"
              />
              <span className="text-[9px] text-gray-500 block mt-0.5">სკანირება</span>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-gray-400 font-medium">
            piu.ge — დაკარგული და ნაპოვნი ცხოველების ეროვნული პლატფორმა
          </div>
        </div>
      </div>
    </div>
  );
}
