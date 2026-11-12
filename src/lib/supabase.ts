import { createClient } from "@supabase/supabase-js";
import type { PetListing } from "@/data/listings-types";

const DEFAULT_SUPABASE_URL = "https://etxrjqodhxbbpcmwdkjb.supabase.co";
const DEFAULT_ANON_KEY = "sb_publishable_M14kTz239MvcYwCvuDwH-A_ctplZszw";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

/** Public client for browser / anonymous queries */
export const supabase = createClient(supabaseUrl, supabaseAnonKey || "dummy-anon-key");

/** Privileged server client (bypasses RLS for admin tasks & user management) */
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey || "dummy-admin-key",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

export type DbListingRow = {
  id: string;
  kind: string;
  animal: string;
  name: string;
  place: string;
  tone: string;
  lat: number;
  lng: number;
  description: string | null;
  photo_urls: string[] | null;
  photo_icon_url: string | null;
  main_photo_index: number | null;
  video_url: string | null;
  sex: string | null;
  color: string | null;
  breed: string | null;
  age: string | null;
  has_collar: string | null;
  has_chip: string | null;
  reward: string | null;
  event_date: string | null;
  contact_phone: string;
  contact_name: string | null;
  contact_social: string | null;
  user_id: string | null;
  status: string;
  views?: number | null;
  created_at: string;
  updated_at: string;
};

export function dbRowToPetListing(row: DbListingRow): PetListing {
  return {
    id: row.id,
    kind: row.kind as PetListing["kind"],
    animal: row.animal as PetListing["animal"],
    name: row.name,
    place: row.place,
    tone: row.tone as PetListing["tone"],
    lat: Number(row.lat),
    lng: Number(row.lng),
    description: row.description || undefined,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    photoIconUrl: row.photo_icon_url || undefined,
    mainPhotoIndex: row.main_photo_index ?? 0,
    videoUrl: row.video_url || undefined,
    sex: (row.sex as PetListing["sex"]) || "უცნობი",
    color: row.color || undefined,
    breed: row.breed || undefined,
    age: row.age || undefined,
    hasCollar: (row.has_collar as PetListing["hasCollar"]) || "უცნობი",
    hasChip: (row.has_chip as PetListing["hasChip"]) || "უცნობი",
    reward: row.reward || undefined,
    eventDate: row.event_date || undefined,
    contactPhone: row.contact_phone,
    contactName: row.contact_name || undefined,
    contactSocial: row.contact_social || undefined,
    createdAt: row.created_at,
    status: row.status || "active",
    views: Number(row.views) || 0,
  };
}

export function petListingToDbRow(
  listing: PetListing,
  userId?: string | null,
  status: string = "active",
): Partial<DbListingRow> {
  return {
    id: listing.id,
    kind: listing.kind,
    animal: listing.animal,
    name: listing.name,
    place: listing.place,
    tone: listing.tone,
    lat: listing.lat,
    lng: listing.lng,
    description: listing.description || null,
    photo_urls: listing.photoUrls || [],
    photo_icon_url: listing.photoIconUrl || null,
    main_photo_index: listing.mainPhotoIndex ?? 0,
    video_url: listing.videoUrl || null,
    sex: listing.sex || "უცნობი",
    color: listing.color || null,
    breed: listing.breed || null,
    age: listing.age || null,
    has_collar: listing.hasCollar || "უცნობი",
    has_chip: listing.hasChip || "უცნობი",
    reward: listing.reward || null,
    event_date: listing.eventDate || null,
    contact_phone: listing.contactPhone || "",
    contact_name: listing.contactName || null,
    contact_social: listing.contactSocial || null,
    user_id: userId || null,
    status,
    views: listing.views ?? 0,
    created_at: listing.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
