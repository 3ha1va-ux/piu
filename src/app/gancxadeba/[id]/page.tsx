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
  return {
    title: `${listing.name} · ${listing.place} — piu.ge`,
    description:
      listing.description ||
      `${markerCaption(listing.animal, listing.tone)} — ${listing.place}`,
  };
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(decodeURIComponent(id));
  if (!listing) notFound();

  return (
    <div className="min-h-full bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
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
