import "server-only";

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const TELEMETRY_FILE = path.join(DATA_DIR, "telemetry.json");
const MAX_SESSIONS = 250; // Rolling buffer size (keeps last 250 sessions to stay <150KB)

export type VisitorSession = {
  id: string;
  ip: string;
  deviceType: "mobile" | "desktop" | "tablet";
  screenResolution: string;
  viewport: string;
  browser: string;
  os: string;
  language: string;
  batteryLevel: number | null; // e.g. 78 or null if protected
  batteryCharging: boolean | null;
  batteryProtected: boolean;
  page: string;
  referrer: string;
  connectionType?: string;
  createdAt: string;
};

export type TelemetryData = {
  totalVisits: number;
  sessions: VisitorSession[];
  deviceCounts: { mobile: number; desktop: number; tablet: number };
  browserCounts: Record<string, number>;
  osCounts: Record<string, number>;
  resolutionCounts: Record<string, number>;
  pageCounts: Record<string, number>;
};

let inMemoryTelemetry: TelemetryData | null = null;

function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Ignore serverless read-only errors
  }
}

function loadTelemetry(): TelemetryData {
  if (inMemoryTelemetry) return inMemoryTelemetry;

  try {
    ensureDataDir();
    if (existsSync(TELEMETRY_FILE)) {
      const raw = readFileSync(TELEMETRY_FILE, "utf8");
      const parsed = JSON.parse(raw) as TelemetryData;
      if (parsed && Array.isArray(parsed.sessions)) {
        inMemoryTelemetry = parsed;
        return inMemoryTelemetry;
      }
    }
  } catch {
    // fallback to initial
  }

  inMemoryTelemetry = {
    totalVisits: 0,
    sessions: [],
    deviceCounts: { mobile: 0, desktop: 0, tablet: 0 },
    browserCounts: {},
    osCounts: {},
    resolutionCounts: {},
    pageCounts: {},
  };
  return inMemoryTelemetry;
}

function persistTelemetry(data: TelemetryData) {
  inMemoryTelemetry = data;
  try {
    ensureDataDir();
    writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Ignore write errors on read-only environments
  }
}

export function recordVisitorSession(session: Omit<VisitorSession, "id" | "createdAt">): VisitorSession {
  const store = loadTelemetry();

  const newSession: VisitorSession = {
    ...session,
    id: `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };

  store.totalVisits += 1;

  // Update rolling buffer
  store.sessions.unshift(newSession);
  if (store.sessions.length > MAX_SESSIONS) {
    store.sessions = store.sessions.slice(0, MAX_SESSIONS);
  }

  // Aggregate device
  if (session.deviceType === "mobile") store.deviceCounts.mobile += 1;
  else if (session.deviceType === "tablet") store.deviceCounts.tablet += 1;
  else store.deviceCounts.desktop += 1;

  // Aggregate browser
  const b = session.browser || "სხვა";
  store.browserCounts[b] = (store.browserCounts[b] || 0) + 1;

  // Aggregate OS
  const o = session.os || "სხვა";
  store.osCounts[o] = (store.osCounts[o] || 0) + 1;

  // Aggregate Resolution
  const r = session.screenResolution || "უცნობი";
  store.resolutionCounts[r] = (store.resolutionCounts[r] || 0) + 1;

  // Aggregate Page
  const p = session.page || "/";
  store.pageCounts[p] = (store.pageCounts[p] || 0) + 1;

  persistTelemetry(store);
  return newSession;
}

export function getTelemetrySummary() {
  const store = loadTelemetry();

  // Sort Top Resolutions
  const topResolutions = Object.entries(store.resolutionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([resolution, count]) => ({ resolution, count }));

  // Sort Top Browsers
  const topBrowsers = Object.entries(store.browserCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([browser, count]) => ({ browser, count }));

  // Sort Top OS
  const topOs = Object.entries(store.osCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([os, count]) => ({ os, count }));

  // Sort Top Pages
  const topPages = Object.entries(store.pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([page, count]) => ({ page, count }));

  // Battery stats over rolling sessions
  let reportedCount = 0;
  let protectedCount = 0;
  let batterySum = 0;
  let chargingCount = 0;

  for (const s of store.sessions) {
    if (s.batteryLevel !== null && typeof s.batteryLevel === "number") {
      reportedCount += 1;
      batterySum += s.batteryLevel;
      if (s.batteryCharging) chargingCount += 1;
    } else {
      protectedCount += 1;
    }
  }

  const avgBatteryLevel = reportedCount > 0 ? Math.round(batterySum / reportedCount) : 0;

  return {
    totalVisits: store.totalVisits,
    deviceCounts: store.deviceCounts,
    topResolutions,
    topBrowsers,
    topOs,
    topPages,
    batteryStats: {
      reportedCount,
      protectedCount,
      avgLevel: avgBatteryLevel,
      chargingCount,
    },
    recentSessions: store.sessions.slice(0, 100),
  };
}
