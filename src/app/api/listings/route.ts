import { NextResponse } from "next/server";
import type {
  AnimalType,
  CreateListingPayload,
  ListingTone,
  PetSex,
  TriState,
} from "@/data/listings-types";
import { queryListings } from "@/lib/listingsQuery";
import {
  createUserListing,
  newListingId,
  MAX_PHOTO_UPLOAD_BYTES,
  saveListingPhotos,
  saveListingVideo,
} from "@/lib/userListingsStore";

export const runtime = "nodejs";

const TONES: ListingTone[] = ["lost", "gift", "found"];
const ANIMALS: AnimalType[] = ["ძაღლი", "კატა"];
const SEXES: PetSex[] = ["მამალი", "მდედრი", "უცნობი"];
const TRI: TriState[] = ["კი", "არა", "უცნობი"];

function parseList<T extends string>(raw: string | null, allowed: T[]): T[] {
  if (!raw) return [...allowed];
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as T[];
  const filtered = parts.filter((p) => allowed.includes(p));
  return filtered.length > 0 ? filtered : [...allowed];
}

function isTone(v: string): v is ListingTone {
  return TONES.includes(v as ListingTone);
}

function isAnimal(v: string): v is AnimalType {
  return ANIMALS.includes(v as AnimalType);
}

function isSex(v: string): v is PetSex {
  return SEXES.includes(v as PetSex);
}

function isTri(v: string): v is TriState {
  return TRI.includes(v as TriState);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const west = Number(searchParams.get("west"));
  const south = Number(searchParams.get("south"));
  const east = Number(searchParams.get("east"));
  const north = Number(searchParams.get("north"));
  const zoom = Number(searchParams.get("zoom") ?? "7");

  if (![west, south, east, north, zoom].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: "Invalid bbox/zoom" }, { status: 400 });
  }

  const tones = parseList<ListingTone>(searchParams.get("tones"), TONES);
  const animals = parseList<AnimalType>(searchParams.get("animals"), ANIMALS);

  const result = await queryListings({
    bbox: { west, south, east, north },
    zoom,
    tones,
    animals,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const toneRaw = String(form.get("tone") ?? "");
    const animalRaw = String(form.get("animal") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const place = String(form.get("place") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const color = String(form.get("color") ?? "").trim();
    const breed = String(form.get("breed") ?? "").trim();
    const age = String(form.get("age") ?? "").trim();
    const reward = String(form.get("reward") ?? "").trim();
    const eventDate = String(form.get("eventDate") ?? "").trim();
    const contactPhone = String(form.get("contactPhone") ?? "").trim();
    const contactName = String(form.get("contactName") ?? "").trim();
    const contactSocial = String(form.get("contactSocial") ?? "").trim();
    const sexRaw = String(form.get("sex") ?? "").trim();
    const collarRaw = String(form.get("hasCollar") ?? "").trim();
    const chipRaw = String(form.get("hasChip") ?? "").trim();
    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));

    if (!isTone(toneRaw)) {
      return NextResponse.json({ error: "აირჩიე სტატუსი" }, { status: 400 });
    }
    if (!isAnimal(animalRaw)) {
      return NextResponse.json({ error: "აირჩიე სახეობა" }, { status: 400 });
    }
    if (!place) {
      return NextResponse.json(
        { error: "მიუთითე ადგილი / ქალაქი" },
        { status: 400 },
      );
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "მონიშნე ადგილი რუკაზე" },
        { status: 400 },
      );
    }
    if (lat < 40.6 || lat > 43.9 || lng < 39.2 || lng > 47.2) {
      return NextResponse.json(
        { error: "ადგილი უნდა იყოს საქართველოში" },
        { status: 400 },
      );
    }
    if (toneRaw === "gift" && !name) {
      return NextResponse.json(
        { error: "მიუთითე ცხოველის სახელი" },
        { status: 400 },
      );
    }
    if (toneRaw === "lost" && !eventDate) {
      return NextResponse.json(
        { error: "მიუთითე დაკარგვის თარიღი" },
        { status: 400 },
      );
    }
    if (!contactPhone || contactPhone.replace(/\D/g, "").length < 9) {
      return NextResponse.json(
        { error: "მიუთითე სწორი ტელეფონის ნომერი" },
        { status: 400 },
      );
    }

    const photos = form
      .getAll("photos")
      .filter(
        (v): v is File =>
          v instanceof File &&
          v.size > 0 &&
          v.size <= MAX_PHOTO_UPLOAD_BYTES,
      )
      .slice(0, 4);

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "ატვირთე მინიმუმ ერთი ფოტო (მაქს. 12MB თითო)" },
        { status: 400 },
      );
    }

    const mainPhotoIndex = Math.min(
      Math.max(0, Number(form.get("mainPhotoIndex") ?? 0) || 0),
      photos.length - 1,
    );

    const videoRaw = form.get("video");
    const video =
      videoRaw instanceof File && videoRaw.size > 0 ? videoRaw : null;
    if (video && video.size > 40_000_000) {
      return NextResponse.json(
        { error: "ვიდეო მაქსიმუმ 40MB უნდა იყოს" },
        { status: 400 },
      );
    }

    const payload: CreateListingPayload = {
      tone: toneRaw,
      animal: animalRaw,
      name: name || "უცნობი",
      place,
      lat,
      lng,
      description: description || undefined,
      color: color || undefined,
      breed: breed || undefined,
      age: age || undefined,
      reward: reward || undefined,
      eventDate: eventDate || undefined,
      contactPhone,
      contactName: contactName || undefined,
      contactSocial: contactSocial || undefined,
      sex: isSex(sexRaw) ? sexRaw : undefined,
      hasCollar: isTri(collarRaw) ? collarRaw : undefined,
      hasChip: isTri(chipRaw) ? chipRaw : undefined,
    };

    const listingId = newListingId();
    const savedPhotos = await saveListingPhotos(
      listingId,
      photos,
      mainPhotoIndex,
    );
    if (!savedPhotos || savedPhotos.photoUrls.length === 0) {
      return NextResponse.json(
        { error: "ფოტოს ატვირთვა ვერ მოხერხდა" },
        { status: 400 },
      );
    }
    const videoUrl = await saveListingVideo(listingId, video);

    const listing = await createUserListing(
      payload,
      savedPhotos,
      listingId,
      videoUrl,
    );

    return NextResponse.json({ listing }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "განცხადების შენახვა ვერ მოხერხდა" },
      { status: 500 },
    );
  }
}
