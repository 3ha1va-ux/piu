import "server-only";

import sharp from "sharp";
import { storeMediaObject } from "@/lib/mediaStorage";

/** Max upload size accepted before server-side compression (bytes). */
export const MAX_PHOTO_UPLOAD_BYTES = 12_000_000;

export type ProcessedListingPhotos = {
  photoUrls: string[];
  photoIconUrl: string;
  mainPhotoIndex: number;
};

/**
 * Compress a listing photo to AVIF (~200–400KB typical) and optionally a
 * tiny list icon (~5–10KB).
 */
async function encodeFullAvif(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .avif({ quality: 52, effort: 4 })
    .toBuffer();
}

async function encodeIconAvif(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({
      width: 72,
      height: 72,
      fit: "cover",
      position: "attention",
    })
    .avif({ quality: 38, effort: 4 })
    .toBuffer();
}

/**
 * Process uploaded files: AVIF gallery images + one tiny icon for the main photo.
 * Falls back to JPEG if AVIF encoding fails on a given file.
 */
export async function processAndStoreListingPhotos(
  listingId: string,
  files: File[],
  mainPhotoIndex = 0,
): Promise<ProcessedListingPhotos | null> {
  const images = files.filter(
    (f) => f.type.startsWith("image/") && f.size > 0 && f.size <= MAX_PHOTO_UPLOAD_BYTES,
  );
  if (images.length === 0) return null;

  const clampedMain = Math.min(
    Math.max(0, mainPhotoIndex),
    images.length - 1,
  );

  const photoUrls: string[] = [];
  let photoIconUrl = "";

  for (let i = 0; i < images.length; i++) {
    const file = images[i]!;
    const input = Buffer.from(await file.arrayBuffer());

    let fullBuf: Buffer;
    let fullType = "image/avif";
    let fullExt = "avif";
    try {
      fullBuf = await encodeFullAvif(input);
    } catch {
      fullBuf = await sharp(input)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 82, mozjpeg: true })
        .toBuffer();
      fullType = "image/jpeg";
      fullExt = "jpg";
    }

    const full = await storeMediaObject({
      key: `uploads/${listingId}/photo-${i + 1}.${fullExt}`,
      body: fullBuf,
      contentType: fullType,
    });
    photoUrls.push(full.url);

    if (i === clampedMain) {
      let iconBuf: Buffer;
      let iconType = "image/avif";
      let iconExt = "avif";
      try {
        iconBuf = await encodeIconAvif(input);
      } catch {
        iconBuf = await sharp(input)
          .rotate()
          .resize({ width: 72, height: 72, fit: "cover", position: "attention" })
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
        iconType = "image/jpeg";
        iconExt = "jpg";
      }
      const icon = await storeMediaObject({
        key: `uploads/${listingId}/photo-${i + 1}-icon.${iconExt}`,
        body: iconBuf,
        contentType: iconType,
      });
      photoIconUrl = icon.url;
    }
  }

  if (!photoIconUrl && photoUrls[0]) {
    photoIconUrl = photoUrls[0];
  }

  return {
    photoUrls,
    photoIconUrl,
    mainPhotoIndex: clampedMain,
  };
}
