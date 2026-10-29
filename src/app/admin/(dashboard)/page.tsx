"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AnalyticsData {
  summary: {
    totalListings: number;
    userListingsCount: number;
    demoListingsCount: number;
    withPhotos: number;
    withReward: number;
    withChip: number;
    withCollar: number;
  };
  byTone: {
    lost: number;
    found: number;
    gift: number;
  };
  byAnimal: {
    ძაღლი: number;
    კატა: number;
    სხვა: number;
  };
  bySex: {
    მამალი: number;
    მდედრი: number;
    უცნობი: number;
  };
  topPlaces: Array<{ name: string; count: number }>;
  recentUserListings: Array<{
    id: string;
    name: string;
    animal: string;
    tone: string;
    place: string;
    createdAt?: string;
    contactPhone?: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("მონაცემების ჩატვირთვა ვერ მოხერხდა");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchAnalytics();
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("მონაცემების ჩატვირთვა ვერ მოხერხდა");
        return res.json();
      })
      .then((json) => {
        if (!ignore) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "შეცდომა");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const toneGeorgian: Record<string, { label: string; color: string; bg: string }> = {
    lost: { label: "დაკარგული", color: "text-amber-800", bg: "bg-amber-100" },
    found: { label: "ნაპოვნი", color: "text-emerald-800", bg: "bg-emerald-100" },
    gift: { label: "ჩუქდება", color: "text-blue-800", bg: "bg-blue-100" },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] font-display">
            მართვის დეშბორდი
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">
            piu.ge-ს განცხადებებისა და აქტივობის რეალურ დროში მიმოხილვა
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium bg-white border border-[var(--mist)] rounded-xl hover:bg-[var(--mist)]/30 text-[var(--ink)] transition flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>განახლება</span>
          </button>
          <Link
            href="/gancxadeba"
            target="_blank"
            className="px-4 py-2 text-sm font-medium bg-[var(--moss)] hover:bg-[var(--leaf)] text-white rounded-xl transition shadow-xs flex items-center gap-2"
          >
            <span>+</span>
            <span>ახალი განცხადება</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Listings */}
        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">სულ განცხადება</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-2 font-display">
            {loading ? "..." : data?.summary.totalListings.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>აქტიური ბაზაში</span>
          </div>
        </div>

        {/* User Listings */}
        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">მომხმარებლების მიერ</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--moss)] mt-2 font-display">
            {loading ? "..." : data?.summary.userListingsCount.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            საიტიდან დამატებული
          </div>
        </div>

        {/* Dogs vs Cats */}
        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">ძაღლები / კატები</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-2 font-display flex items-baseline gap-2">
            <span className="text-[var(--dog)]">
              {loading ? "..." : data?.byAnimal["ძაღლი"] || 0}
            </span>
            <span className="text-sm font-normal text-[var(--ink-soft)]">/</span>
            <span className="text-[var(--cat)]">
              {loading ? "..." : data?.byAnimal["კატა"] || 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            🐶 ძაღლი vs 🐱 კატა
          </div>
        </div>

        {/* With Photos */}
        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">ფოტოთი ატვირთული</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--ink)] mt-2 font-display">
            {loading ? "..." : data?.summary.withPhotos.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            {data && data.summary.totalListings > 0
              ? `${Math.round((data.summary.withPhotos / data.summary.totalListings) * 100)}% სურათით`
              : "—"}
          </div>
        </div>
      </div>

      {/* Tone Breakdown Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Lost */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-l-amber-500 border border-[var(--mist)]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-900">დაკარგული</span>
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
              სასწრაფო
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-950 mt-2 font-display">
            {loading ? "..." : data?.byTone.lost.toLocaleString("ka-GE")}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            ვეძებთ პატრონს ან ცხოველს
          </p>
        </div>

        {/* Found */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-l-emerald-500 border border-[var(--mist)]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-900">ნაპოვნი</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
              შეფარებული
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-950 mt-2 font-display">
            {loading ? "..." : data?.byTone.found.toLocaleString("ka-GE")}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            ნაპოვნია და ეძებს პატრონს
          </p>
        </div>

        {/* Gift */}
        <div className="bg-white rounded-2xl p-5 border-l-4 border-l-blue-500 border border-[var(--mist)]/70 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">ჩუქდება</span>
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              გაშვილება
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-950 mt-2 font-display">
            {loading ? "..." : data?.byTone.gift.toLocaleString("ka-GE")}
          </div>
          <p className="text-xs text-[var(--ink-soft)] mt-1">
            ჩუქდება სანდო ხელში
          </p>
        </div>
      </div>

      {/* Two Column Section: Recent User Listings & Top Places */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent User Listings (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--mist)]/70 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)] font-display">
                მომხმარებლების ბოლო განცხადებები
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                საიტიდან დამატებული უახლესი მონაცემები
              </p>
            </div>
            <Link
              href="/admin/listings?source=user"
              className="text-xs font-semibold text-[var(--moss)] hover:underline"
            >
              ყველას ნახვა →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)]">
              იტვირთება...
            </div>
          ) : !data?.recentUserListings || data.recentUserListings.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)] bg-[var(--paper)] rounded-xl border border-dashed border-[var(--mist)]">
              მომხმარებლების მიერ დამატებული განცხადებები ჯერ არ არის
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--mist)] text-[var(--ink-soft)] text-xs">
                    <th className="pb-3 font-medium">ცხოველი / სახელი</th>
                    <th className="pb-3 font-medium">სტატუსი</th>
                    <th className="pb-3 font-medium">ლოკაცია</th>
                    <th className="pb-3 font-medium">კონტაქტი</th>
                    <th className="pb-3 font-medium text-right">მოქმედება</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--mist)]/60">
                  {data.recentUserListings.map((item) => {
                    const toneMeta = toneGeorgian[item.tone] || {
                      label: item.tone,
                      color: "text-gray-800",
                      bg: "bg-gray-100",
                    };
                    return (
                      <tr key={item.id} className="hover:bg-[var(--paper)]/50 transition">
                        <td className="py-3 pr-2">
                          <div className="font-medium text-[var(--ink)]">
                            {item.name || "უცნობი"}
                          </div>
                          <div className="text-xs text-[var(--ink-soft)]">
                            {item.animal}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${toneMeta.bg} ${toneMeta.color}`}
                          >
                            {toneMeta.label}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-xs text-[var(--ink-soft)] max-w-[140px] truncate">
                          {item.place}
                        </td>
                        <td className="py-3 px-2 text-xs text-[var(--ink-soft)]">
                          {item.contactPhone || "—"}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          <Link
                            href={`/gancxadeba/${item.id}`}
                            target="_blank"
                            className="text-xs font-medium text-[var(--moss)] hover:underline"
                          >
                            ნახვა ↗
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Locations (1 col) */}
        <div className="bg-white rounded-2xl border border-[var(--mist)]/70 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)] font-display">
                ტოპ ლოკაციები
              </h2>
              <p className="text-xs text-[var(--ink-soft)]">
                ქალაქები განცხადებების სიმრავლით
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)]">
              იტვირთება...
            </div>
          ) : (
            <div className="space-y-3">
              {data?.topPlaces.slice(0, 7).map((place, idx) => {
                const max = data.topPlaces[0]?.count || 1;
                const percentage = Math.round((place.count / max) * 100);
                return (
                  <div key={place.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[var(--ink)]">
                        {idx + 1}. {place.name}
                      </span>
                      <span className="text-[var(--ink-soft)] font-semibold">
                        {place.count}
                      </span>
                    </div>
                    <div className="w-full bg-[var(--paper)] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[var(--moss)] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links Card */}
      <div className="bg-[var(--mist)]/40 rounded-2xl p-5 border border-[var(--mist)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-semibold text-[var(--ink)] text-sm">
            გჭირდებათ მეტი დეტალი და სრული გრაფიკები?
          </div>
          <div className="text-xs text-[var(--ink-soft)]">
            გადადით ანალიტიკის სექციაში დროითი გრაფიკებისა და განაწილების სანახავად
          </div>
        </div>
        <Link
          href="/admin/analytics"
          className="px-4 py-2 bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs font-medium rounded-xl transition shadow-xs whitespace-nowrap"
        >
          სრული ანალიტიკა →
        </Link>
      </div>
    </div>
  );
}
