import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Legacy typo route — keep bookmarks working. */
export default async function LegacyListingRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/gancxadeba/${encodeURIComponent(id)}`);
}
