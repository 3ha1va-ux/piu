import type { PetListing } from "@/data/listings-types";

/** Main gallery photo URL (cover). */
export function listingMainPhotoUrl(listing: PetListing): string | undefined {
  const photos = listing.photoUrls;
  if (!photos || photos.length === 0) return undefined;
  const idx = Math.min(
    Math.max(0, listing.mainPhotoIndex ?? 0),
    photos.length - 1,
  );
  return photos[idx];
}

/**
 * Tiny list/map thumbnail. Prefer dedicated icon; fall back to main photo.
 */
export function listingIconUrl(listing: PetListing): string | undefined {
  return listing.photoIconUrl ?? listingMainPhotoUrl(listing);
}
