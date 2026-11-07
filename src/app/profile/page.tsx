"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PosterModal from "@/components/PosterModal";
import { useUserAuth } from "@/lib/userAuthContext";
import { supabase, dbRowToPetListing, type DbListingRow } from "@/lib/supabase";
import type { PetListing, ListingTone } from "@/data/listings-types";

export default function MyListingsPage() {
  const { user, openAuthModal, logout } = useUserAuth();
  const [listings, setListings] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [reloadKey, setReloadKey] = useState(0);

  // Poster modal state
  const [selectedPosterListing, setSelectedPosterListing] =
    useState<PetListing | null>(null);

  // Status update / delete feedback
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    async function loadUserListings() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          const res = await fetch("/api/listings/user", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (ignore) return;

          if (res.ok) {
            const json = await res.json();
            setListings(json.listings || []);
            setLoading(false);
            return;
          }
        }

        // Direct Supabase fallback
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        if (ignore) return;

        if (!error && Array.isArray(data)) {
          setListings((data as DbListingRow[]).map(dbRowToPetListing));
        } else {
          setListings([]);
        }
      } catch (err) {
        console.warn("Failed to load user listings:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUserListings();

    return () => {
      ignore = true;
    };
  }, [user, reloadKey]);

  // Update listing status (e.g. active <-> resolved / adopted)
  const handleStatusUpdate = async (
    id: string,
    newStatus: "active" | "resolved" | "adopted",
    successNote: string,
  ) => {
    try {
      setIsProcessing(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("გთხოვთ ხელახლა გაიაროთ ავტორიზაცია");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/listings/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        setStatusMessage(successNote);
        setListings((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l)),
        );
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.error || "სტატუსის შეცვლა ვერ მოხერხდა");
      }
    } catch {
      alert("კავშირის შეცდომა სერვერთან");
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete listing securely
  const handleDelete = async (id: string) => {
    try {
      setIsProcessing(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("გთხოვთ ხელახლა გაიაროთ ავტორიზაცია");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/listings/user", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setStatusMessage("განცხადება წარმატებით წაიშალა");
        setDeleteConfirmId(null);
        setListings((prev) => prev.filter((l) => l.id !== id));
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        const json = await res.json().catch(() => null);
        alert(json?.error || "განცხადების წაშლა ვერ მოხერხდა");
      }
    } catch {
      alert("კავშირის შეცდომა სერვერთან");
    } finally {
      setIsProcessing(false);
    }
  };

  // Refresh 45-day listing lifespan
  const handleRefreshDate = async (id: string) => {
    try {
      setIsProcessing(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("გთხოვთ ხელახლა გაიაროთ ავტორიზაცია");
        setIsProcessing(false);
        return;
      }

      const res = await fetch("/api/listings/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, refreshDate: true }),
      });

      if (res.ok) {
        setStatusMessage("განცხადების ვადა წარმატებით განახლდა კიდევ 45 დღით! 🔄");
        setListings((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, createdAt: new Date().toISOString(), status: "active" }
              : l,
          ),
        );
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        alert("ვადის განახლება ვერ მოხერხდა");
      }
    } catch {
      alert("კავშირის შეცდომა სერვერთან");
    } finally {
      setIsProcessing(false);
    }
  };

  const getListingAge = (createdAt?: string) => {
    if (!createdAt) return { days: 0, isExpired: false, daysLeft: 45 };
    const ms = Date.now() - new Date(createdAt).getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return { days, isExpired: days >= 45, daysLeft: Math.max(0, 45 - days) };
  };

  const toneMeta: Record<
    ListingTone,
    { label: string; color: string; bg: string }
  > = {
    lost: { label: "დაკარგული", color: "text-amber-800", bg: "bg-amber-100" },
    found: { label: "ნაპოვნი", color: "text-emerald-800", bg: "bg-emerald-100" },
    gift: { label: "ჩუქდება", color: "text-blue-800", bg: "bg-blue-100" },
  };

  // Filter listings based on active filter tab
  const filteredListings = listings.filter((item) => {
    const st = item.status || "active";
    if (filter === "active") return st === "active";
    if (filter === "resolved") return st === "resolved" || st === "adopted";
    return true;
  });

  const activeCount = listings.filter(
    (l) => (l.status || "active") === "active",
  ).length;
  const resolvedCount = listings.filter(
    (l) => l.status === "resolved" || l.status === "adopted",
  ).length;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 md:py-10">
        {/* Banner if not logged in */}
        {!user ? (
          <div className="my-12 p-8 sm:p-12 text-center bg-white rounded-3xl border border-[var(--mist)] shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-[var(--mist)]/40 text-[var(--moss)] flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-display text-[var(--ink)]">
              პირადი კაბინეტი
            </h1>
            <p className="text-sm text-[var(--ink-soft)] mt-2 mb-6">
              თქვენი განცხადებების სანახავად, დასარედაქტირებლად და სამართავად
              გთხოვთ გაიაროთ ავტორიზაცია
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
                      <svg
                        className="w-3 h-3 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>ვერიფიცირებული</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs sm:text-sm text-[var(--ink-soft)]">
                    <span>{user.email}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-red-600 hover:text-red-800 underline transition font-medium"
                    >
                      გამოსვლა
                    </button>
                  </div>
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
                <svg
                  className="w-5 h-5 text-emerald-600 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
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
                    თქვენ მიერ რუკაზე დამატებული ცხოველების სია და სტატუსები
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[var(--mist)] self-start sm:self-auto text-xs font-medium">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "all"
                        ? "bg-[var(--moss)] text-white"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    ყველა ({listings.length})
                  </button>
                  <button
                    onClick={() => setFilter("active")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "active"
                        ? "bg-[var(--moss)] text-white"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    აქტიური ({activeCount})
                  </button>
                  <button
                    onClick={() => setFilter("resolved")}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      filter === "resolved"
                        ? "bg-[var(--moss)] text-white"
                        : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                    }`}
                  >
                    ნაპოვნი / გაჩუქებული ({resolvedCount})
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-sm text-[var(--ink-soft)] flex flex-col items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-6 w-6 text-[var(--moss)]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>იტვირთება...</span>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="py-16 px-4 text-center bg-white rounded-3xl border border-dashed border-[var(--mist)] space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--moss)] flex items-center justify-center mx-auto text-2xl">
                    🐾
                  </div>
                  <h3 className="font-display font-semibold text-base text-[var(--ink)]">
                    {filter === "all"
                      ? "თქვენ ჯერ არ გაქვთ დამატებული განცხადება"
                      : filter === "active"
                      ? "აქტიური განცხადებები არ მოიძებნა"
                      : "დასრულებული (ნაპოვნი/გაჩუქებული) განცხადებები ჯერ არ არის"}
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
                    {filter === "all"
                      ? "თუ დაკარგეთ, იპოვეთ ან ჩუქდება ცხოველი, დაამატეთ განცხადება რუკაზე რათა სხვებმაც შეამჩნიონ."
                      : "სტატუსის შეცვლის შემდეგ განცხადებები შესაბამის განყოფილებაში გადაინაცვლებს."}
                  </p>
                  {filter === "all" && (
                    <Link
                      href="/gancxadeba"
                      className="inline-flex mt-2 py-2 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs font-semibold transition"
                    >
                      + განცხადების დამატება
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((item) => {
                    const meta = toneMeta[item.tone] || {
                      label: item.tone,
                      color: "text-gray-800",
                      bg: "bg-gray-100",
                    };
                    const thumb =
                      item.photoIconUrl ||
                      item.photoUrls?.[0] ||
                      (item.animal === "ძაღლი"
                        ? "/demo/icons/dog-1.avif"
                        : "/demo/icons/cat-1.avif");

                    const isResolved =
                      item.status === "resolved" || item.status === "adopted";
                    const { isExpired, daysLeft } = getListingAge(item.createdAt);

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex flex-col justify-between gap-4 transition ${
                          isResolved
                            ? "border-emerald-200 bg-emerald-50/20"
                            : "border-[var(--mist)]/70"
                        }`}
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
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}
                              >
                                {meta.label}
                              </span>
                              <span className="text-xs text-[var(--ink-soft)]">
                                {item.animal}
                              </span>

                              {/* Status Badge */}
                              {item.status === "resolved" ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                  <span>🎉</span>
                                  <span>ნაპოვნია</span>
                                </span>
                              ) : item.status === "adopted" ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                                  <span>🏡</span>
                                  <span>გაჩუქდა</span>
                                </span>
                              ) : isExpired ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                  <span>⏳</span>
                                  <span>ვადაგასულია (45+ დღე)</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  🟢 აქტიურია ({daysLeft} დღე)
                                </span>
                              )}
                            </div>

                            <h3 className="font-display font-bold text-base text-[var(--ink)] mt-1.5 truncate">
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            {!isResolved ? (
                              <>
                                {item.tone === "lost" ? (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(
                                        item.id,
                                        "resolved",
                                        "გილოცავთ! ცხოველი მონიშნულია როგორც ნაპოვნი 🎉",
                                      )
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                                    title="მონიშნეთ როგორც ნაპოვნი"
                                  >
                                    <span>🎉</span>
                                    <span>ვიპოვეთ!</span>
                                  </button>
                                ) : item.tone === "gift" ? (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(
                                        item.id,
                                        "adopted",
                                        "გილოცავთ! ცხოველმა იპოვა ახალი სახლი 🏡",
                                      )
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                                    title="მონიშნეთ როგორც გაჩუქებული"
                                  >
                                    <span>🏡</span>
                                    <span>გაჩუქდა!</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(
                                        item.id,
                                        "resolved",
                                        "გილოცავთ! ცხოველი დაუბრუნდა პატრონს 🎉",
                                      )
                                    }
                                    disabled={isProcessing}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                                    title="მონიშნეთ როგორც პატრონთან დაბრუნებული"
                                  >
                                    <span>🎉</span>
                                    <span>დაუბრუნდა პატრონს</span>
                                  </button>
                                )}

                                {isExpired && (
                                  <button
                                    onClick={() => handleRefreshDate(item.id)}
                                    disabled={isProcessing}
                                    className="px-2.5 py-1.5 rounded-lg bg-[var(--moss)] hover:bg-[var(--leaf)] text-white font-semibold transition flex items-center gap-1 shadow-xs disabled:opacity-50"
                                    title="განცხადების ვადის გაგრძელება კიდევ 45 დღით"
                                  >
                                    <span>🔄</span>
                                    <span>ვადის განახლება</span>
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleStatusUpdate(
                                    item.id,
                                    "active",
                                    "განცხადება დაბრუნდა აქტიურ სტატუსში რუკაზე",
                                  )
                                }
                                disabled={isProcessing}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition flex items-center gap-1 disabled:opacity-50"
                                title="განცხადების ხელახლა აქტივაცია რუკაზე"
                              >
                                <span>↩️</span>
                                <span>ხელახლა აქტივაცია</span>
                              </button>
                            )}

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
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </Link>

                            <button
                              onClick={() => setDeleteConfirmId(item.id)}
                              disabled={isProcessing}
                              className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                              title="წაშლა"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-100 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="font-bold text-lg font-display text-[var(--ink)] mb-2">
              განცხადების წაშლა
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mb-6 leading-relaxed">
              დარწმუნებული ხართ რომ გსურთ ამ განცხადების წაშლა? განცხადება სამუდამოდ წაიშლება საიტიდან.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] transition"
              >
                გაუქმება
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition disabled:opacity-50"
              >
                {isProcessing ? "იშლება..." : "დიახ, წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
