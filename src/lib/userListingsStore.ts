import "server-only";

import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
} from "fs";
import path from "path";
import type {
  CreateListingPayload,
  ListingKind,
  ListingTone,
  PetListing,
} from "@/data/listings-types";
import { TONE_LABELS } from "@/lib/markerStyles";
import {
  isR2Enabled,
  readJsonFromR2,
  storeMediaObject,
  writeJsonToR2,
} from "@/lib/mediaStorage";
import {
  supabaseAdmin,
  dbRowToPetListing,
  petListingToDbRow,
  type DbListingRow,
} from "@/lib/supabase";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "user-listings.json");
const STORE_TMP = path.join(DATA_DIR, "user-listings.json.tmp");
const R2_LISTINGS_KEY = "data/user-listings.json";

function kindFromTone(tone: ListingTone): ListingKind {
  return TONE_LABELS[tone] as ListingKind;
}

function ensureDataDir() {
  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    // Read-only filesystem in serverless environments (Netlify/AWS Lambda)
  }
}

function readLocalFile(): PetListing[] {
  try {
    ensureDataDir();
    if (!existsSync(STORE_PATH)) return [];
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as PetListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalFile(listings: PetListing[]) {
  try {
    ensureDataDir();
    // Atomic replace avoids torn reads when two writes overlap on disk.
    writeFileSync(STORE_TMP, JSON.stringify(listings, null, 2), "utf8");
    renameSync(STORE_TMP, STORE_PATH);
  } catch {
    // Ignore writes on read-only serverless filesystem
  }
}

/** In-process mutex so concurrent creates don't clobber each other. */
let writeChain: Promise<void> = Promise.resolve();

function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

let memoryCache: PetListing[] | null = null;
let hydratePromise: Promise<PetListing[]> | null = null;

async function hydrate(): Promise<PetListing[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const list = (data as DbListingRow[]).map(dbRowToPetListing);
      memoryCache = list;
      return list;
    }
  } catch (err) {
    console.warn("Supabase fetch failed, trying local fallback:", err);
  }

  if (isR2Enabled()) {
    const remote = await readJsonFromR2<PetListing[]>(R2_LISTINGS_KEY);
    if (Array.isArray(remote)) {
      memoryCache = remote;
      try {
        writeLocalFile(remote);
      } catch {
        /* ephemeral FS may be read-only on serverless */
      }
      return remote;
    }
  }
  const local = readLocalFile();
  memoryCache = local;
  return local;
}

export async function readUserListings(): Promise<PetListing[]> {
  if (memoryCache) return memoryCache;
  if (!hydratePromise) hydratePromise = hydrate();
  try {
    return await hydratePromise;
  } finally {
    hydratePromise = null;
  }
}

async function persistListings(listings: PetListing[]): Promise<void> {
  memoryCache = listings;
  try {
    writeLocalFile(listings);
  } catch {
    /* ignore on read-only FS */
  }
  if (isR2Enabled()) {
    await writeJsonToR2(R2_LISTINGS_KEY, listings);
  }
}

function extensionFor(type: string, fallback: string): string {
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("webm")) return "webm";
  if (type.includes("quicktime")) return "mov";
  return fallback;
}

export {
  processAndStoreListingPhotos as saveListingPhotos,
  MAX_PHOTO_UPLOAD_BYTES,
} from "@/lib/processListingPhotos";

export async function saveListingVideo(
  listingId: string,
  file: File | null,
): Promise<string | undefined> {
  if (!file || file.size <= 0) return undefined;
  if (!file.type.startsWith("video/")) return undefined;
  if (file.size > 40_000_000) return undefined;

  const ext = extensionFor(file.type, "mp4");
  const key = `uploads/${listingId}-video.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeMediaObject({
    key,
    body: buffer,
    contentType: file.type || "video/mp4",
  });
  return stored.url;
}

export function newListingId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createUserListing(
  payload: CreateListingPayload,
  photos: {
    photoUrls: string[];
    photoIconUrl?: string;
    mainPhotoIndex?: number;
  },
  id = newListingId(),
  videoUrl?: string,
): Promise<PetListing> {
  const listing: PetListing = {
    id,
    kind: kindFromTone(payload.tone),
    animal: payload.animal,
    name:
      payload.name.trim() ||
      (payload.tone === "found" || payload.tone === "lost" ? "უცნობი" : ""),
    place: payload.place.trim(),
    tone: payload.tone,
    lat: payload.lat,
    lng: payload.lng,
    description: payload.description?.trim() || undefined,
    photoUrls: photos.photoUrls.length > 0 ? photos.photoUrls : undefined,
    photoIconUrl: photos.photoIconUrl,
    mainPhotoIndex: photos.mainPhotoIndex ?? 0,
    videoUrl,
    sex: payload.sex,
    color: payload.color?.trim() || undefined,
    breed: payload.breed?.trim() || undefined,
    age: payload.age?.trim() || undefined,
    hasCollar: payload.hasCollar,
    hasChip: payload.hasChip,
    reward: payload.reward?.trim() || undefined,
    eventDate: payload.eventDate || undefined,
    contactPhone: payload.contactPhone.trim(),
    contactName: payload.contactName?.trim() || undefined,
    contactSocial: payload.contactSocial?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  return withWriteLock(async () => {
    // 1. Persist to Supabase Postgres
    try {
      const dbRow = petListingToDbRow(listing);
      const { error } = await supabaseAdmin.from("listings").insert([dbRow]);
      if (error) {
        console.error("Supabase insert error:", error);
      }
    } catch (err) {
      console.error("Failed to write listing to Supabase:", err);
    }

    // 2. Persist to local cache / backup
    const all = await readUserListings();
    const next = [listing, ...all];
    await persistListings(next);
    return listing;
  });
}

export async function deleteUserListing(id: string): Promise<boolean> {
  return withWriteLock(async () => {
    try {
      await supabaseAdmin.from("listings").delete().eq("id", id);
    } catch (err) {
      console.error("Supabase delete error:", err);
    }

    const all = await readUserListings();
    const index = all.findIndex((item) => item.id === id);
    if (index === -1) return false;
    const next = all.filter((item) => item.id !== id);
    await persistListings(next);
    return true;
  });
}

export async function updateUserListing(
  id: string,
  updates: Partial<PetListing>,
): Promise<PetListing | null> {
  return withWriteLock(async () => {
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.place !== undefined) dbUpdates.place = updates.place;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.breed !== undefined) dbUpdates.breed = updates.breed;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.reward !== undefined) dbUpdates.reward = updates.reward;
      if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
      if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
      if (updates.contactSocial !== undefined) dbUpdates.contact_social = updates.contactSocial;
      dbUpdates.updated_at = new Date().toISOString();

      await supabaseAdmin.from("listings").update(dbUpdates).eq("id", id);
    } catch (err) {
      console.error("Supabase update error:", err);
    }

    const all = await readUserListings();
    const index = all.findIndex((item) => item.id === id);
    if (index === -1) return null;
    const updated: PetListing = { ...all[index], ...updates };
    const next = [...all];
    next[index] = updated;
    await persistListings(next);
    return updated;
  });
}
