"use client";

import { useEffect, useState, useCallback } from "react";

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
  timeline: Array<{ date: string; count: number }>;
}

export default function AdminAnalyticsPage() {
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

  const total = data?.summary.totalListings || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] font-display">
            ანალიტიკა და სტატისტიკა
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">
            განცხადებების დეტალური დემოგრაფიული და დროითი ანალიზი
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-3.5 py-2 text-sm font-medium bg-white border border-[var(--mist)] rounded-xl hover:bg-[var(--mist)]/30 text-[var(--ink)] transition flex items-center gap-2 self-start sm:self-auto"
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
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">სულ მონაცემები</div>
          <div className="text-3xl font-bold text-[var(--ink)] mt-2 font-display">
            {loading ? "..." : data?.summary.totalListings.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            {data?.summary.userListingsCount} მომხმარებლის / {data?.summary.demoListingsCount} დემო
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">დაკარგული ცხოველები</div>
          <div className="text-3xl font-bold text-amber-700 mt-2 font-display">
            {loading ? "..." : data?.byTone.lost.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            სრული რაოდენობის {data ? Math.round((data.byTone.lost / total) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">ნაპოვნი ცხოველები</div>
          <div className="text-3xl font-bold text-emerald-700 mt-2 font-display">
            {loading ? "..." : data?.byTone.found.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            სრული რაოდენობის {data ? Math.round((data.byTone.found / total) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
          <div className="text-xs font-medium text-[var(--ink-soft)]">ჩუქდება</div>
          <div className="text-3xl font-bold text-blue-700 mt-2 font-display">
            {loading ? "..." : data?.byTone.gift.toLocaleString("ka-GE")}
          </div>
          <div className="mt-2 text-xs text-[var(--ink-soft)]">
            სრული რაოდენობის {data ? Math.round((data.byTone.gift / total) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Visual Chart: Tone Distribution Bar */}
      <div className="bg-white rounded-2xl p-6 border border-[var(--mist)]/70 shadow-xs space-y-4">
        <h2 className="text-lg font-bold font-display text-[var(--ink)]">
          განცხადებების ტიპის განაწილება
        </h2>
        {data && (
          <div className="space-y-3">
            <div className="w-full h-7 rounded-xl overflow-hidden flex bg-gray-100">
              <div
                className="bg-amber-500 h-full transition-all duration-700 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ width: `${(data.byTone.lost / total) * 100}%` }}
                title={`დაკარგული: ${data.byTone.lost}`}
              >
                {data.byTone.lost > 0 ? `${Math.round((data.byTone.lost / total) * 100)}%` : ""}
              </div>
              <div
                className="bg-emerald-500 h-full transition-all duration-700 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ width: `${(data.byTone.found / total) * 100}%` }}
                title={`ნაპოვნი: ${data.byTone.found}`}
              >
                {data.byTone.found > 0 ? `${Math.round((data.byTone.found / total) * 100)}%` : ""}
              </div>
              <div
                className="bg-blue-500 h-full transition-all duration-700 flex items-center justify-center text-[11px] font-bold text-white"
                style={{ width: `${(data.byTone.gift / total) * 100}%` }}
                title={`ჩუქდება: ${data.byTone.gift}`}
              >
                {data.byTone.gift > 0 ? `${Math.round((data.byTone.gift / total) * 100)}%` : ""}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--ink-soft)] pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="font-medium text-[var(--ink)]">დაკარგული:</span>
                <span>{data.byTone.lost.toLocaleString("ka-GE")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="font-medium text-[var(--ink)]">ნაპოვნი:</span>
                <span>{data.byTone.found.toLocaleString("ka-GE")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="font-medium text-[var(--ink)]">ჩუქდება:</span>
                <span>{data.byTone.gift.toLocaleString("ka-GE")}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Animal/Sex & Attributes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Animal & Sex Breakdown */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--mist)]/70 shadow-xs space-y-5">
          <h2 className="text-lg font-bold font-display text-[var(--ink)]">
            ცხოველის სახეობა და სქესი
          </h2>

          {/* Animals */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
              სახეობა
            </div>
            {data && (
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1.5 text-[var(--ink)]">
                      <span>🐶</span> ძაღლი
                    </span>
                    <span className="font-semibold text-[var(--ink-soft)]">
                      {data.byAnimal["ძაღლი"]} ({Math.round((data.byAnimal["ძაღლი"] / total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--paper)] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--dog)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(data.byAnimal["ძაღლი"] / total) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1.5 text-[var(--ink)]">
                      <span>🐱</span> კატა
                    </span>
                    <span className="font-semibold text-[var(--ink-soft)]">
                      {data.byAnimal["კატა"]} ({Math.round((data.byAnimal["კატა"] / total) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-[var(--paper)] h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--cat)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(data.byAnimal["კატა"] / total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sex */}
          <div className="space-y-3 pt-3 border-t border-[var(--mist)]/60">
            <div className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
              სქესი
            </div>
            {data && (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[var(--paper)] rounded-xl p-3">
                  <div className="text-xs text-[var(--ink-soft)]">მამალი</div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display mt-1">
                    {data.bySex["მამალი"]}
                  </div>
                </div>
                <div className="bg-[var(--paper)] rounded-xl p-3">
                  <div className="text-xs text-[var(--ink-soft)]">მდედრი</div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display mt-1">
                    {data.bySex["მდედრი"]}
                  </div>
                </div>
                <div className="bg-[var(--paper)] rounded-xl p-3">
                  <div className="text-xs text-[var(--ink-soft)]">უცნობი</div>
                  <div className="text-lg font-bold text-[var(--ink)] font-display mt-1">
                    {data.bySex["უცნობი"]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Listing Attributes Quality */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--mist)]/70 shadow-xs space-y-5">
          <h2 className="text-lg font-bold font-display text-[var(--ink)]">
            განცხადების დეტალურობა და ატრიბუტები
          </h2>

          {data && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[var(--paper)] rounded-2xl p-4 border border-[var(--mist)]/50">
                <div className="text-2xl mb-1">📸</div>
                <div className="text-xs text-[var(--ink-soft)] font-medium">ფოტოთი</div>
                <div className="text-2xl font-bold text-[var(--ink)] font-display mt-1">
                  {data.summary.withPhotos}
                </div>
                <div className="text-xs text-[var(--moss)] font-semibold mt-1">
                  {Math.round((data.summary.withPhotos / total) * 100)}% განცხადებების
                </div>
              </div>

              <div className="bg-[var(--paper)] rounded-2xl p-4 border border-[var(--mist)]/50">
                <div className="text-2xl mb-1">🎁</div>
                <div className="text-xs text-[var(--ink-soft)] font-medium">ჯილდოთი</div>
                <div className="text-2xl font-bold text-[var(--ink)] font-display mt-1">
                  {data.summary.withReward}
                </div>
                <div className="text-xs text-[var(--moss)] font-semibold mt-1">
                  {Math.round((data.summary.withReward / total) * 100)}% განცხადებების
                </div>
              </div>

              <div className="bg-[var(--paper)] rounded-2xl p-4 border border-[var(--mist)]/50">
                <div className="text-2xl mb-1">🏷️</div>
                <div className="text-xs text-[var(--ink-soft)] font-medium">მიკროჩიპით</div>
                <div className="text-2xl font-bold text-[var(--ink)] font-display mt-1">
                  {data.summary.withChip}
                </div>
                <div className="text-xs text-[var(--moss)] font-semibold mt-1">
                  {Math.round((data.summary.withChip / total) * 100)}% დაჩიპული
                </div>
              </div>

              <div className="bg-[var(--paper)] rounded-2xl p-4 border border-[var(--mist)]/50">
                <div className="text-2xl mb-1">🦮</div>
                <div className="text-xs text-[var(--ink-soft)] font-medium">საყელურით</div>
                <div className="text-2xl font-bold text-[var(--ink)] font-display mt-1">
                  {data.summary.withCollar}
                </div>
                <div className="text-xs text-[var(--moss)] font-semibold mt-1">
                  {Math.round((data.summary.withCollar / total) * 100)}% საყელურიანი
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Locations Ranking */}
      <div className="bg-white rounded-2xl p-6 border border-[var(--mist)]/70 shadow-xs space-y-4">
        <h2 className="text-lg font-bold font-display text-[var(--ink)]">
          განცხადებები ქალაქებისა და რეგიონების მიხედვით (TOP 10)
        </h2>
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.topPlaces.map((place, idx) => {
              const max = data.topPlaces[0]?.count || 1;
              const pctOfMax = Math.round((place.count / max) * 100);
              const pctOfTotal = Math.round((place.count / total) * 100);
              return (
                <div
                  key={place.name}
                  className="p-3 rounded-xl bg-[var(--paper)]/50 border border-[var(--mist)]/50 space-y-1.5"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-[var(--ink)]">
                      {idx + 1}. {place.name}
                    </span>
                    <span className="text-[var(--ink-soft)] font-medium">
                      {place.count} ({pctOfTotal}%)
                    </span>
                  </div>
                  <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--moss)] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
