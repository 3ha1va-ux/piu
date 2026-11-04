import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
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

  const title = `${listing.name} · ${listing.place} — piu.ge`;
  const description =
    listing.description ||
    `${markerCaption(listing.animal, listing.tone)} — ${listing.place}`;
  const photo = listing.photoUrls?.[0] || listing.photoIconUrl;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: photo ? [{ url: photo, alt: listing.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: photo ? [photo] : [],
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
    <div className="min-h-full bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 pb-16 md:px-8">
        <p className="mb-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[var(--lake)]">
          განცხადების დეტალები
        </p>
        <ListingDetailView listing={listing} />
      </main>
    </div>
  );
}
