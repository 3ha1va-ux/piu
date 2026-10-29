import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  if (!listing) return { title: "განცხადება — იპოვე" };
  return {
    title: `${listing.name} · ${listing.place} — იპოვე`,
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
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink md:text-2xl"
        >
          piu.ge
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-ink-soft transition hover:text-ink">
            რუკა
          </Link>
          <Link
            href="/gancxadeba"
            className="rounded-md bg-moss px-3 py-1.5 text-white transition hover:bg-leaf"
          >
            დამატება
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 md:px-8">
        <p className="mb-6 text-sm font-medium uppercase tracking-[0.18em] text-lake">
          განცხადების დეტალები
        </p>
        <ListingDetailView listing={listing} />
      </main>
    </div>
  );
}
