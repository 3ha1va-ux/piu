import "server-only";

import { petListings } from "@/data/listings-data";
import type { PetListing } from "@/data/listings-types";
import { withDemoPhotos } from "@/lib/demoPhotos";
import { readUserListings } from "@/lib/userListingsStore";

export async function getListingById(id: string): Promise<PetListing | null> {
  const users = await readUserListings();
  const listing =
    users.find((item) => item.id === id) ??
    petListings.find((item) => item.id === id) ??
    null;
  return listing ? withDemoPhotos(listing) : null;
}
