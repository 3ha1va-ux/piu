"use client";

import { useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { PetListing } from "@/data/listings-types";
import { listingIconUrl } from "@/lib/listingMedia";
import { markerVisual } from "@/lib/markerStyles";

/** How many sidebar rows to show initially / per scroll chunk */
const PAGE_SIZE = 40;

type Props = {
  items: PetListing[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function VirtualListingList({
  items,
  activeId,
  onSelect,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(PAGE_SIZE, items.length),
  );

  const itemsRef = useRef(items);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // New viewport / filter → restart from first chunk (keep active row if any)
  useEffect(() => {
    let next = Math.min(PAGE_SIZE, items.length);
    const selectedId = activeIdRef.current;
    if (selectedId) {
      const index = items.findIndex((item) => item.id === selectedId);
      if (index >= 0) {
        next = Math.max(next, Math.min(items.length, index + 1));
      }
    }
    setVisibleCount(next);
  }, [items]);

  // Map → list: expand loaded window so the selected row is included (never shrink)
  useEffect(() => {
    if (!activeId) return;
    const index = itemsRef.current.findIndex((item) => item.id === activeId);
    if (index < 0) return;
    setVisibleCount((prev) =>
      Math.max(prev, Math.min(itemsRef.current.length, index + 1)),
    );
  }, [activeId]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const virtualizer = useVirtualizer({
    count: visibleItems.length + (hasMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 8,
    getItemKey: (index) =>
      index < visibleItems.length
        ? (visibleItems[index]?.id ?? index)
        : `more-${visibleCount}`,
  });

  // Scroll selected row into view when selection changes
  useEffect(() => {
    if (!activeId) return;
    const index = itemsRef.current
      .slice(0, visibleCount)
      .findIndex((item) => item.id === activeId);
    if (index < 0) return;
    const frame = requestAnimationFrame(() => {
      virtualizer.scrollToIndex(index, { align: "start", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeId, visibleCount, virtualizer]);

  // Load next chunk when near the bottom
  useEffect(() => {
    const root = parentRef.current;
    if (!root || !hasMore) return;

    const onScroll = () => {
      const remaining =
        root.scrollHeight - root.scrollTop - root.clientHeight;
      if (remaining > 160) return;
      setVisibleCount((prev) =>
        Math.min(itemsRef.current.length, prev + PAGE_SIZE),
      );
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [hasMore, visibleCount]);

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-8 text-[15px] text-ink-soft">
        ამ ფილტრით / არეალში განცხადება არ არის.
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="listing-rail h-full overflow-y-auto overscroll-contain"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((row) => {
          if (row.index >= visibleItems.length) {
            return (
              <div
                key={row.key}
                className="absolute left-0 top-0 flex w-full items-center justify-center px-5 text-xs text-ink-soft"
                style={{
                  height: row.size,
                  transform: `translateY(${row.start}px)`,
                }}
              >
                კიდევ {items.length - visibleCount} · ჩამოსქროლე…
              </div>
            );
          }

          const item = visibleItems[row.index];
          if (!item) return null;
          const visual = markerVisual(item.animal, item.tone);
          const icon = listingIconUrl(item);
          const selected = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={selected ? "true" : undefined}
              className={`absolute left-0 top-0 flex w-full items-center gap-3 border-b border-moss/8 px-5 py-2.5 text-left transition ${
                selected
                  ? "bg-mist z-[1] shadow-[inset_3px_0_0_0_var(--moss)]"
                  : "hover:bg-paper/90"
              }`}
              style={{
                height: row.size,
                transform: `translateY(${row.start}px)`,
              }}
            >
              {icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={icon}
                  alt=""
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-moss/10"
                />
              ) : (
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
                  style={{ backgroundColor: visual.background }}
                  aria-hidden
                >
                  {visual.label.slice(0, 1)}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">
                  {item.name}
                </span>
                <span className="mt-0.5 block truncate text-[13px] leading-snug text-ink-soft">
                  {visual.caption} · {item.place}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
