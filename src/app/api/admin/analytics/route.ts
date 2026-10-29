import { NextResponse } from "next/server";
import { petListings } from "@/data/listings-data";
import { isAuthenticatedServer } from "@/lib/adminAuth";
import { readUserListings } from "@/lib/userListingsStore";

export const runtime = "nodejs";

export async function GET() {
  const isAuth = await isAuthenticatedServer();
  if (!isAuth) {
    return NextResponse.json({ error: "უნებართვო წვდომა" }, { status: 401 });
  }

  const userItems = await readUserListings();
  const demoItems = petListings;
  const all = [...userItems, ...demoItems];

  // Counts by tone
  const byTone = {
    lost: 0,
    found: 0,
    gift: 0,
  };

  // Counts by animal
  const byAnimal = {
    ძაღლი: 0,
    კატა: 0,
    სხვა: 0,
  };

  // Counts by sex
  const bySex = {
    მამალი: 0,
    მდედრი: 0,
    უცნობი: 0,
  };

  let withPhotos = 0;
  let withReward = 0;
  let withChip = 0;
  let withCollar = 0;

  // City / Place aggregation
  const placeCounts: Record<string, number> = {};

  // Timeline aggregation (by month/date)
  const dateCounts: Record<string, number> = {};

  for (const item of all) {
    // Tone
    if (item.tone === "lost") byTone.lost++;
    else if (item.tone === "found") byTone.found++;
    else if (item.tone === "gift") byTone.gift++;

    // Animal
    if (item.animal === "ძაღლი") byAnimal.ძაღლი++;
    else if (item.animal === "კატა") byAnimal.კატა++;
    else byAnimal.სხვა++;

    // Sex
    if (item.sex === "მამალი") bySex.მამალი++;
    else if (item.sex === "მდედრი") bySex.მდედრი++;
    else bySex.უცნობი++;

    // Attributes
    if (item.photoUrls && item.photoUrls.length > 0) withPhotos++;
    if (item.reward && item.reward.trim().length > 0) withReward++;
    if (item.hasChip === "კი") withChip++;
    if (item.hasCollar === "კი") withCollar++;

    // Place
    const place = item.place?.split(",")[0]?.trim() || "უცნობი";
    placeCounts[place] = (placeCounts[place] || 0) + 1;

    // Date
    const d = item.createdAt || item.eventDate;
    if (d) {
      const monthKey = d.slice(0, 7); // YYYY-MM
      dateCounts[monthKey] = (dateCounts[monthKey] || 0) + 1;
    }
  }

  // Top 10 places
  const topPlaces = Object.entries(placeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Timeline sorted
  const timeline = Object.entries(dateCounts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  // Recent user listings
  const recentUserListings = userItems.slice(0, 5).map((item) => ({
    id: item.id,
    name: item.name,
    animal: item.animal,
    tone: item.tone,
    place: item.place,
    createdAt: item.createdAt,
    contactPhone: item.contactPhone,
  }));

  return NextResponse.json({
    summary: {
      totalListings: all.length,
      userListingsCount: userItems.length,
      demoListingsCount: demoItems.length,
      withPhotos,
      withReward,
      withChip,
      withCollar,
    },
    byTone,
    byAnimal,
    bySex,
    topPlaces,
    timeline,
    recentUserListings,
  });
}
