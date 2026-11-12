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

interface TelemetrySession {
  id: string;
  ip: string;
  deviceType: "mobile" | "desktop" | "tablet";
  screenResolution: string;
  viewport: string;
  browser: string;
  os: string;
  language: string;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  batteryProtected: boolean;
  page: string;
  referrer: string;
  createdAt: string;
}

interface TelemetrySummary {
  totalVisits: number;
  deviceCounts: { mobile: number; desktop: number; tablet: number };
  topResolutions: Array<{ resolution: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topOs: Array<{ os: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  batteryStats: {
    reportedCount: number;
    protectedCount: number;
    avgLevel: number;
    chargingCount: number;
  };
  recentSessions: TelemetrySession[];
}

function timeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 5) return "ახლახანს";
    if (diff < 60) return `${diff} წამის წინ`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins} წუთის წინ`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} საათის წინ`;
    return new Date(dateString).toLocaleDateString("ka-GE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"listings" | "telemetry">("telemetry");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [telemetry, setTelemetry] = useState<TelemetrySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [listingsRes, telemetryRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/admin/telemetry"),
      ]);

      if (!listingsRes.ok) throw new Error("განცხადებების სტატისტიკა ვერ ჩაიტვირთა");
      const listingsJson = await listingsRes.json();
      setData(listingsJson);

      if (telemetryRes.ok) {
        const telemetryJson = await telemetryRes.json();
        setTelemetry(telemetryJson.summary || null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "შეცდომა");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchData();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const total = data?.summary.totalListings || 1;
  const totalVisits = telemetry?.totalVisits || 0;
  const totalDevices =
    (telemetry?.deviceCounts.mobile || 0) +
      (telemetry?.deviceCounts.desktop || 0) +
      (telemetry?.deviceCounts.tablet || 0) || 1;
  const mobilePct = Math.round(((telemetry?.deviceCounts.mobile || 0) / totalDevices) * 100);
  const desktopPct = Math.round(((telemetry?.deviceCounts.desktop || 0) / totalDevices) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] font-display">
            ანალიტიკა და Live ტელემეტრია
          </h1>
          <p className="text-sm text-[var(--ink-soft)] mt-0.5">
            ვიზიტორთა მოწყობილობები, ეკრანები, ბატარეა, IP-ები და განცხადებების სტატისტიკა
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 text-sm font-medium bg-white border border-[var(--mist)] rounded-xl hover:bg-[var(--mist)]/30 text-[var(--ink)] transition flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin text-[var(--moss)]" : ""}`}
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
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-[var(--mist)]/70 w-fit">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === "telemetry"
              ? "bg-[var(--moss)] text-white shadow-xs"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)]"
          }`}
        >
          <span>📱</span>
          <span>ვიზიტორთა ტელემეტრია ({totalVisits})</span>
        </button>

        <button
          onClick={() => setActiveTab("listings")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
            activeTab === "listings"
              ? "bg-[var(--moss)] text-white shadow-xs"
              : "text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)]"
          }`}
        >
          <span>🐾</span>
          <span>განცხადებების სტატისტიკა ({data?.summary.totalListings || 0})</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* TAB 1: VISITOR TELEMETRY */}
      {activeTab === "telemetry" && (
        <div className="space-y-6">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Visits */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  სულ ვიზიტები
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
                  👥
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-[var(--ink)] mt-2">
                {totalVisits.toLocaleString("ka-GE")}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                დაფიქსირებული სესიები
              </p>
            </div>

            {/* Mobile vs Desktop */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  მოწყობილობები
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700 text-sm">
                  📱
                </span>
              </div>
              <div className="text-2xl font-bold font-display text-[var(--ink)] mt-2 flex items-baseline gap-2">
                <span>{mobilePct}%</span>
                <span className="text-xs font-normal text-[var(--ink-soft)]">მობილური</span>
                <span className="text-sm font-semibold text-[var(--ink-soft)]">•</span>
                <span>{desktopPct}%</span>
                <span className="text-xs font-normal text-[var(--ink-soft)]">PC</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-2.5 overflow-hidden flex">
                <div style={{ width: `${mobilePct}%` }} className="bg-[var(--moss)] h-full" />
                <div style={{ width: `${desktopPct}%` }} className="bg-blue-500 h-full" />
              </div>
            </div>

            {/* Top Browser / OS */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  მთავარი ბრაუზერი & OS
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 text-sm">
                  🌐
                </span>
              </div>
              <div className="text-xl font-bold font-display text-[var(--ink)] mt-2 truncate">
                {telemetry?.topBrowsers[0]?.browser || "Chrome"} /{" "}
                {telemetry?.topOs[0]?.os || "iOS"}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                ყველაზე გავრცელებული გარემო
              </p>
            </div>

            {/* Battery Health / Stats */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  ბატარეა (საშუალო)
                </span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700 text-sm">
                  🔋
                </span>
              </div>
              <div className="text-2xl font-bold font-display text-[var(--ink)] mt-2 flex items-center gap-2">
                <span>
                  {telemetry?.batteryStats.reportedCount ? `${telemetry.batteryStats.avgLevel}%` : "—"}
                </span>
                {telemetry?.batteryStats.chargingCount ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-sans font-medium">
                    ⚡ {telemetry.batteryStats.chargingCount} იტენება
                  </span>
                ) : null}
              </div>
              <p className="text-[11px] text-[var(--ink-soft)] mt-1 truncate">
                🔒 {telemetry?.batteryStats.protectedCount || 0} დაცულია (iOS/Safari)
              </p>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Screen Resolutions */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <h3 className="font-display font-bold text-base text-[var(--ink)] mb-3 flex items-center gap-2">
                <span>🖥️</span>
                <span>ეკრანის გაფართოებები</span>
              </h3>
              <div className="space-y-2.5">
                {telemetry?.topResolutions && telemetry.topResolutions.length > 0 ? (
                  telemetry.topResolutions.map((r) => {
                    const pct = Math.round((r.count / totalVisits) * 100) || 1;
                    return (
                      <div key={r.resolution}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="font-mono text-[var(--ink)]">{r.resolution}</span>
                          <span className="text-[var(--ink-soft)]">
                            {r.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[var(--paper)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[var(--moss)] h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[var(--ink-soft)]">მონაცემები ჯერ არ არის</p>
                )}
              </div>
            </div>

            {/* Operating Systems */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <h3 className="font-display font-bold text-base text-[var(--ink)] mb-3 flex items-center gap-2">
                <span>📱</span>
                <span>ოპერაციული სისტემები</span>
              </h3>
              <div className="space-y-2.5">
                {telemetry?.topOs && telemetry.topOs.length > 0 ? (
                  telemetry.topOs.map((o) => {
                    const pct = Math.round((o.count / totalVisits) * 100) || 1;
                    return (
                      <div key={o.os}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-[var(--ink)]">{o.os}</span>
                          <span className="text-[var(--ink-soft)]">
                            {o.count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[var(--paper)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[var(--ink-soft)]">მონაცემები ჯერ არ არის</p>
                )}
              </div>
            </div>

            {/* Top Visited Pages */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <h3 className="font-display font-bold text-base text-[var(--ink)] mb-3 flex items-center gap-2">
                <span>📄</span>
                <span>პოპულარული გვერდები</span>
              </h3>
              <div className="space-y-2.5">
                {telemetry?.topPages && telemetry.topPages.length > 0 ? (
                  telemetry.topPages.map((p) => {
                    const pct = Math.round((p.count / totalVisits) * 100) || 1;
                    return (
                      <div key={p.page}>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="font-mono text-[var(--ink)] truncate max-w-[180px]">
                            {p.page}
                          </span>
                          <span className="text-[var(--ink-soft)]">
                            {p.count} ნახვა
                          </span>
                        </div>
                        <div className="w-full bg-[var(--paper)] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[var(--ink-soft)]">მონაცემები ჯერ არ არის</p>
                )}
              </div>
            </div>
          </div>

          {/* Live Visitor Sessions Table */}
          <div className="bg-white rounded-2xl border border-[var(--mist)]/70 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--mist)]/70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live რეალური დროის ვიზიტორთა ჟურნალი</span>
                </h3>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">
                  ინახება ბოლო 250 ვიზიტორის დეტალური ტელემეტრია (უსაფრთხო მორბენალი ბუფერი)
                </p>
              </div>
              <span className="text-xs text-[var(--ink-soft)] bg-[var(--paper)] px-3 py-1 rounded-lg">
                ბოლო {telemetry?.recentSessions.length || 0} სესია
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--paper)]/60 text-[var(--ink-soft)] text-xs border-b border-[var(--mist)]">
                  <tr>
                    <th className="py-3 px-4 font-medium">IP მისამართი</th>
                    <th className="py-3 px-4 font-medium">მოწყობილობა & ეკრანი</th>
                    <th className="py-3 px-4 font-medium">ბრაუზერი & OS</th>
                    <th className="py-3 px-4 font-medium">ბატარეა / ელემენტი</th>
                    <th className="py-3 px-4 font-medium">მონახულებული გვერდი</th>
                    <th className="py-3 px-4 font-medium text-right">დრო</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--mist)]/60">
                  {telemetry?.recentSessions && telemetry.recentSessions.length > 0 ? (
                    telemetry.recentSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-[var(--paper)]/40 transition">
                        {/* IP Address */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-semibold text-[var(--ink)]">
                            {s.ip}
                          </div>
                          <div className="text-[10px] text-[var(--ink-soft)] uppercase">
                            {s.language}
                          </div>
                        </td>

                        {/* Device & Resolution */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">
                              {s.deviceType === "mobile"
                                ? "📱"
                                : s.deviceType === "tablet"
                                ? "📟"
                                : "💻"}
                            </span>
                            <span className="font-medium text-xs text-[var(--ink)]">
                              {s.deviceType === "mobile"
                                ? "მობილური"
                                : s.deviceType === "tablet"
                                ? "პლანშეტი"
                                : "დესკტოპი"}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-[var(--ink-soft)]">
                            {s.screenResolution}
                          </div>
                        </td>

                        {/* Browser & OS */}
                        <td className="py-3 px-4">
                          <div className="text-xs font-medium text-[var(--ink)]">
                            {s.browser}
                          </div>
                          <div className="text-[11px] text-[var(--ink-soft)]">{s.os}</div>
                        </td>

                        {/* Battery */}
                        <td className="py-3 px-4">
                          {s.batteryLevel !== null ? (
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-mono font-medium">
                              <span>🔋 {s.batteryLevel}%</span>
                              {s.batteryCharging && <span>⚡</span>}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--ink-soft)] italic">
                              🔒 დაცული ({s.os === "iOS" ? "iOS" : "Safari"})
                            </span>
                          )}
                        </td>

                        {/* Page & Referrer */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs text-[var(--moss)] truncate max-w-[200px]">
                            {s.page}
                          </div>
                          <div className="text-[10px] text-[var(--ink-soft)] truncate max-w-[180px]">
                            საიდან: {s.referrer || "პირდაპირი"}
                          </div>
                        </td>

                        {/* Time */}
                        <td className="py-3 px-4 text-right text-xs text-[var(--ink-soft)] whitespace-nowrap">
                          {timeAgo(s.createdAt)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[var(--ink-soft)]">
                        ვიზიტორთა ჩანაწერები ჯერ არ ფიქსირდება
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LISTINGS DEMOGRAPHICS STATS (EXISTING) */}
      {activeTab === "listings" && data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  სულ განცხადება
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
                  🐾
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-[var(--ink)] mt-2">
                {data.summary.totalListings.toLocaleString("ka-GE")}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {data.summary.userListingsCount} მომხმარებლის, {data.summary.demoListingsCount} დემო
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  დაკარგული
                </span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 text-sm">
                  📍
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-amber-800 mt-2">
                {data.byTone.lost}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {Math.round((data.byTone.lost / total) * 100)}% ყველა განცხადებიდან
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  ნაპოვნი
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm">
                  🎉
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-emerald-800 mt-2">
                {data.byTone.found}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {Math.round((data.byTone.found / total) * 100)}% ყველა განცხადებიდან
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--ink-soft)] uppercase tracking-wider">
                  ჩუქდება
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700 text-sm">
                  🎁
                </span>
              </div>
              <div className="text-3xl font-bold font-display text-blue-800 mt-2">
                {data.byTone.gift}
              </div>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                {Math.round((data.byTone.gift / total) * 100)}% ყველა განცხადებიდან
              </p>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* By Animal */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <h3 className="font-display font-bold text-base text-[var(--ink)] mb-3">
                ცხოველის ტიპი
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>ძაღლი ({data.byAnimal.ძაღლი})</span>
                    <span>{Math.round((data.byAnimal.ძაღლი / total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[var(--paper)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[var(--moss)] h-full rounded-full"
                      style={{ width: `${(data.byAnimal.ძაღლი / total) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span>კატა ({data.byAnimal.კატა})</span>
                    <span>{Math.round((data.byAnimal.კატა / total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[var(--paper)] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full"
                      style={{ width: `${(data.byAnimal.კატა / total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Top Places */}
            <div className="bg-white rounded-2xl p-5 border border-[var(--mist)]/70 shadow-xs">
              <h3 className="font-display font-bold text-base text-[var(--ink)] mb-3">
                ტოპ ლოკაციები
              </h3>
              <div className="space-y-2">
                {data.topPlaces.slice(0, 5).map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--ink)] font-medium">📍 {p.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--paper)] font-semibold text-[var(--ink-soft)]">
                      {p.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
