"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function TelemetryCollector() {
  const pathname = usePathname();
  const lastReportedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid re-reporting same path in quick succession
    if (lastReportedPath.current === pathname) return;
    lastReportedPath.current = pathname;

    // Do not track admin dashboard visits to keep user stats clean
    if (pathname.startsWith("/admin")) return;

    let isCancelled = false;

    async function sendTelemetry() {
      try {
        let batteryLevel: number | null = null;
        let batteryCharging: boolean | null = null;
        let batteryProtected = false;

        // Safely check battery status where supported (Android / Chrome)
        // Without throwing errors on iOS / Safari / Firefox
        if (typeof navigator !== "undefined" && "getBattery" in navigator) {
          try {
            const batteryManager = await (navigator as unknown as {
              getBattery: () => Promise<{ level: number; charging: boolean }>;
            }).getBattery();
            batteryLevel = Math.round(batteryManager.level * 100);
            batteryCharging = Boolean(batteryManager.charging);
          } catch {
            batteryProtected = true;
          }
        } else {
          batteryProtected = true;
        }

        if (isCancelled) return;

        // Detect device type
        const width = window.screen.width;
        const isMobile =
          /iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(
            navigator.userAgent,
          ) || width < 768;
        const isTablet =
          /ipad|android(?!.*mobile)/i.test(navigator.userAgent) ||
          (width >= 768 && width <= 1024);
        const deviceType: "mobile" | "tablet" | "desktop" = isTablet
          ? "tablet"
          : isMobile
          ? "mobile"
          : "desktop";

        const payload = {
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          deviceType,
          language: navigator.language || "ka",
          batteryLevel,
          batteryCharging,
          batteryProtected,
          page: pathname || "/",
          referrer: document.referrer || "direct",
          connectionType:
            (navigator as unknown as { connection?: { effectiveType?: string } })
              .connection?.effectiveType || undefined,
        };

        // Use non-blocking fetch with keepalive
        fetch("/api/telemetry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {
          // Ignore network errors
        });
      } catch {
        // Completely non-blocking, never fails page render
      }
    }

    // Schedule slightly after mount so user page interactive performance is 0ms affected
    const timer = setTimeout(sendTelemetry, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
