import type { MetadataRoute } from "next";
import { readUserListings } from "@/lib/userListingsStore";
import { petListings } from "@/data/listings-data";
import type { PetListing } from "@/data/listings-types";

export const revalidate = 3600; // regenerate sitemap at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://piu.ge";

  let userItems: PetListing[] = [];
  try {
    userItems = await readUserListings();
  } catch {
    userItems = [];
  }

  const all = [...userItems, ...petListings];

  const listingUrls: MetadataRoute.Sitemap = all.map((item) => {
    let lastMod = new Date();
    if (item.createdAt) {
      const parsed = new Date(item.createdAt);
      if (!isNaN(parsed.getTime())) lastMod = parsed;
    }

    return {
      url: `${baseUrl}/gancxadeba/${encodeURIComponent(item.id)}`,
      lastModified: lastMod,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    };
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "hourly" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dzieba`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gancxadeba`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/istoriebi`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/rchevebi`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/wesebi`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    ...listingUrls,
  ];
}
