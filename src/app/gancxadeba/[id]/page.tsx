import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListingDetailView from "@/components/ListingDetailView";
import { getListingById } from "@/lib/getListing";
import { markerCaption } from "@/lib/markerStyles";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingById(decodeURIComponent(id));
  if (!listing) return { title: "განცხადება — piu.ge" };

  const toneLabel =
    listing.tone === "lost"
      ? "🚨 დაიკარგა!"
      : listing.tone === "found"
      ? "🎉 ნაპოვნია!"
      : "🏡 ჩუქდება!";
  const rewardLabel = listing.reward ? ` · 🎁 ჯილდო: ${listing.reward}` : "";
  const title = `${toneLabel} ${listing.animal} "${listing.name || "უცნობი"}" · ${listing.place}${rewardLabel} — piu.ge`;
  const description =
    listing.description ||
    `${markerCaption(listing.animal, listing.tone)} — ${listing.place}. დაეხმარეთ პატრონთან დაბრუნებაში!`;
  const rawPhoto = listing.photoUrls?.[0] || listing.photoIconUrl;
  const photoUrl = rawPhoto
    ? rawPhoto.startsWith("http")
      ? rawPhoto
      : `https://piu.ge${rawPhoto}`
    : "https://piu.ge/og-image.jpg";
  const pageUrl = `https://piu.ge/gancxadeba/${encodeURIComponent(listing.id)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "piu.ge — დაკარგული ცხოველების პლატფორმა",
      locale: "ka_GE",
      type: "article",
      images: [
        {
          url: photoUrl,
          width: 1200,
          height: 630,
          alt: listing.name || listing.animal,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [photoUrl],
    },
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(decodeURIComponent(id));
  if (!listing) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemPage",
    name: `${listing.kind} ${listing.animal} "${listing.name}"`,
    description:
      listing.description ||
      `${listing.kind} ${listing.animal} — ${listing.place}`,
    image: listing.photoUrls?.[0] || listing.photoIconUrl,
    mainEntity: {
      "@type": "Thing",
      name: listing.name,
      category: listing.animal,
      description: listing.description,
      location: {
        "@type": "Place",
        name: listing.place,
        geo: {
          "@type": "GeoCoordinates",
          latitude: listing.lat,
          longitude: listing.lng,
        },
      },
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 pb-16 md:px-8">
        <p className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[var(--lake)]">
          განცხადების დეტალები
        </p>
        <ListingDetailView listing={listing} />
      </main>

      <SiteFooter />
    </div>
  );
}
