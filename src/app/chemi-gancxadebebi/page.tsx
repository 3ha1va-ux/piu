"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import PosterModal from "@/components/PosterModal";
import { useUserAuth } from "@/lib/userAuthContext";
import type { PetListing, ListingTone } from "@/data/listings-types";

export default function MyListingsPage() {
  const { user, openAuthModal } = useUserAuth();
  const [listings, setListings] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [reloadKey, setReloadKey] = useState(0);

  // Poster modal state
  const [selectedPosterListing, setSelectedPosterListing] = useState<PetListing | null>(null);

  // Status update / edit / delete state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch("/api/listings/search?limit=40")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          const all: PetListing[] = data.results || [];
          const userItems = all.filter((item) => item.id.startsWith("u-"));
          setListings(userItems);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  // Mark as Resolved / Reunited
  const handleMarkResolved = async (id: string, note: string) => {
    try {
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          updates: {
            description: `[🎉 ${note}] ` + (listings.find((l) => l.id === id)?.description || ""),
          },
        }),
      });

      if (res.ok) {
        setStatusMessage(`გილოცავთ! განცხადების სტატუსი განახლდა: ${note}`);
        setLoading(true);
        setReloadKey((k) => k + 1);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch {
      alert("სტატუსის შეცვლა ვერ მოხერხდა");
    }
  };

  // Delete listing
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/admin/listings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setStatusMessage("განცხადება წარმატებით წაიშალა");
        setDeleteConfirmId(null);
        setLoading(true);
        setReloadKey((k) => k + 1);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch {
      alert("წაშლა ვერ მოხერხდა");
    }
  };

  const toneMeta: Record<ListingTone, { label: string; color: string; bg: string }> = {
    lost: { label: "დაკარგული", color: "text-amber-800", bg: "bg-amber-100" },
    found: { label: "ნაპოვნი", color: "text-emerald-800", bg: "bg-emerald-100" },
    gift: { label: "ჩუქდება", color: "text-blue-800", bg: "bg-blue-100" },
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 md:py-10">
        {/* Banner if not logged in */}
        {!user ? (
          <div className="my-12 p-8 sm:p-12 text-center bg-white rounded-3xl border border-[var(--mist)] shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[var(--mist)]/40 text-[var(--moss)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-display text-[var(--ink)]">
              პირადი კაბინეტი
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-2 mb-6">
              თქვენი განცხადებების სანახავად, დასარედაქტირებლად და სამართავად გთხოვთ გაიაროთ ავტორიზაცია
            </p>
            <button
              onClick={openAuthModal}
              className="py-3 px-6 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-sm font-semibold transition shadow-md shadow-[var(--moss)]/15 inline-flex items-center gap-2"
            >
              <span>ავტორიზაცია (Google / Email)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Profile Header */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[var(--mist)]/70 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[var(--moss)] text-white flex items-center justify-center font-display font-bold text-xl uppercase shadow-xs">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
                      {user.name || "მომხმარებელი"}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>ვერიფიცირებული</span>
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">{user.email}</p>
                </div>
              </div>

              <Link
                href="/gancxadeba"
                className="py-2.5 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs sm:text-sm font-semibold transition shadow-xs flex items-center gap-2 self-stretch sm:self-auto justify-center"
              >
                <span>+</span>
                <span>ახალი განცხადების დამატება</span>
              </Link>
            </div>

            {/* Notification alert */}
            {statusMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Listings Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[var(--mist)]/60">
                <div>
                  <h2 className="text-lg font-bold font-display text-[var(--ink)]">
                    ჩემი განცხადებები ({listings.length})
                  </h2>
                  <p className="text-xs text-[var(--ink-soft)]">
                    თქვენ მიერ რუკაზე დამატებული ცხოველების სია
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[var(--mist)] self-start sm:self-auto text-xs font-medium">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "all" ? "bg-[var(--moss)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    ყველა
                  </button>
                  <button
                    onClick={() => setFilter("active")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "active" ? "bg-[var(--moss)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    აქტიური
                  </button>
                  <button
                    onClick={() => setFilter("resolved")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "resolved" ? "bg-[var(--moss)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    ნაპოვნი / გაჩუქებული 🎉
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm text-[var(--ink-soft)] flex flex-col items-center justify-center gap-2">
                  <svg className="animate-spin h-6 w-6 text-[var(--moss)]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>იტვირთება...</span>
                </div>
              ) : listings.length === 0 ? (
                <div className="py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-[var(--mist)] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--moss)] flex items-center justify-center mx-auto text-2xl">
                    🐾
                  </div>
                  <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                    თქვენ ჯერ არ გაქვთ დამატებული განცხადება
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                    თუ დაკარგეთ, იპოვეთ ან ჩუქდება ცხოველი, დაამატეთ განცხადება რუკაზე რათა სხვებმაც შეამჩნიონ.
                  </p>
                  <Link
                    href="/gancxadeba"
                    className="inline-flex mt-2 py-2 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs font-semibold transition"
                  >
                    + განცხადების დამატება
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listings.map((item) => {
                    const meta = toneMeta[item.tone] || {
                      label: item.tone,
                      color: "text-gray-800",
                      bg: "bg-gray-100",
                    };
                    const thumb =
                      item.photoIconUrl ||
                      item.photoUrls?.[0] ||
                      (item.animal === "ძაღლი" ? "/demo/icons/dog-1.avif" : "/demo/icons/cat-1.avif");

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 sm:p-5 border border-[var(--mist)]/70 shadow-xs flex flex-col justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          {/* Photo */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-[var(--mist)] flex-shrink-0 relative">
                            <Image
                              src={thumb}
                              alt={item.name || item.animal}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                              <span className="text-xs text-[var(--ink-soft)]">
                                {item.animal}
                              </span>
                            </div>

                            <h3 className="font-display font-bold text-base text-[var(--ink)] mt-1 truncate">
                              {item.name || "უცნობი"}
                            </h3>
                            <p className="text-xs text-[var(--ink-soft)] mt-0.5 truncate">
                              📍 {item.place}
                            </p>
                            {item.reward && (
                              <p className="text-xs font-semibold text-amber-700 mt-1">
                                🎁 ჯილდო: {item.reward}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="pt-3 border-t border-[var(--mist)]/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          {/* Quick status change buttons */}
                          <div className="flex items-center gap-1.5">
                            {item.tone === "lost" ? (
                              <button
                                onClick={() => handleMarkResolved(item.id, "დაუბრუნდა პატრონს")}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition flex items-center gap-1"
                                title="მონიშნეთ როგორც ნაპოვნი"
                              >
                                <span>🎉</span>
                                <span>ვიპოვეთ!</span>
                              </button>
                            ) : item.tone === "gift" ? (
                              <button
                                onClick={() => handleMarkResolved(item.id, "გაჩუქდა ახალ ოჯახში")}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold transition flex items-center gap-1"
                                title="მონიშნეთ როგორც გაჩუქებული"
                              >
                                <span>🏡</span>
                                <span>გაჩუქდა!</span>
                              </button>
                            ) : null}

                            {/* Flyer button */}
                            <button
                              onClick={() => setSelectedPosterListing(item)}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--mist)] hover:bg-[var(--paper)] text-[var(--ink)] font-medium transition flex items-center gap-1"
                              title="A4 სამძებრო პოსტერის ნახვა და ბეჭდვა"
                            >
                              <span>🖹</span>
                              <span>პოსტერი</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link
                              href={`/gancxadeba/${item.id}`}
                              target="_blank"
                              className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--moss)] rounded-lg hover:bg-[var(--paper)] transition"
                              title="საიტზე ნახვა"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>

                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition"
                              title="წაშლა"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Poster Modal */}
      {selectedPosterListing && (
        <PosterModal
          listing={selectedPosterListing}
          onClose={() => setSelectedPosterListing(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg font-display text-[var(--ink)] mb-2">
              განცხადების წაშლა
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-6">
              დარწმუნებული ხართ რომ გსურთ ამ განცხადების წაშლა? მოქმედების გაუქმება შეუძლებელია.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] transition"
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition"
              >
                დიახ, წაშლა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
