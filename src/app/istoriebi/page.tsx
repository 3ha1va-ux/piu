"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import type { PetListing } from "@/data/listings-types";

export default function HappyStoriesPage() {
  const [stories, setStories] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/listings/search?limit=20")
      .then((res) => res.json())
      .then((data) => {
        // Show demo & resolved listings
        setStories(data.results || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-4">
            <span>🎉</span>
            <span>წარმატებული ძიების ისტორიები</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            ბედნიერი ისტორიები
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[var(--ink-soft)] leading-relaxed">
            შინაური ცხოველები, რომლებიც საზოგადოებისა და piu.ge-ს დახმარებით დაუბრუნდნენ თავიანთ პატრონებს ან იპოვეს ახალი მზრუნველი ოჯახი.
          </p>
        </div>

        {/* Stories Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--ink-soft)] flex flex-col items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6 text-[var(--moss)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>ისტორიები იტვირთება...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.slice(0, 9).map((item, idx) => {
              const photo =
                item.photoUrls?.[0] ||
                item.photoIconUrl ||
                (item.animal === "ძაღლი" ? "/demo/dog-2.jpg" : "/demo/cat-2.jpg");

              const badges = [
                "დაუბრუნდა პატრონს 💚",
                "იპოვა ახალი სახლი 🏡",
                "შეფარებულია & უსაფრთხოდ 🐾",
              ];
              const badge = badges[idx % badges.length];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl overflow-hidden border border-[var(--mist)]/70 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-52 w-full bg-[var(--mist)]">
                      <Image
                        src={photo}
                        alt={item.name || item.animal}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shadow-xs">
                          {badge}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="text-xs text-[var(--ink-soft)] font-medium">
                        📍 {item.place}
                      </div>
                      <h3 className="font-display font-bold text-lg text-[var(--ink)] mt-1">
                        {item.name || "უცნობი"} ({item.animal})
                      </h3>
                      <p className="text-xs text-[var(--ink-soft)] mt-2 line-clamp-3 leading-relaxed">
                        {item.description || "ცხოველი წარმატებით დაუბრუნდა თავის მზრუნველ ოჯახს piu.ge-ს მეშვეობით."}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 border-t border-[var(--mist)]/40 flex items-center justify-between text-xs">
                    <span className="text-[var(--ink-soft)] font-medium">
                      {item.eventDate || "ბოლო პერიოდში"}
                    </span>
                    <Link
                      href={`/gancxadeba/${item.id}`}
                      className="font-semibold text-[var(--moss)] hover:underline"
                    >
                      ისტორიის ნახვა →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share Banner */}
        <div className="mt-16 bg-[var(--mist)]/40 rounded-3xl p-8 border border-[var(--mist)] text-center space-y-4">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-[var(--ink)]">
            თქვენც დაგეხმარათ piu.ge?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-lg mx-auto">
            თუ თქვენი ცხოველი იპოვეთ ან გააჩუქეთ, მონიშნეთ თქვენი განცხადება პირად კაბინეტში და გაუზიარეთ იმედი სხვებს!
          </p>
          <div className="pt-2">
            <Link
              href="/chemi-gancxadebebi"
              className="inline-flex py-3 px-6 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs sm:text-sm font-semibold transition shadow-xs"
            >
              პირად კაბინეტში გადასვლა
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
