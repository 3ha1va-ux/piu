import "server-only";

import { storeMediaObject } from "@/lib/mediaStorage";

/** Max upload size accepted before server-side compression (bytes). */
export const MAX_PHOTO_UPLOAD_BYTES = 12_000_000;

export type ProcessedListingPhotos = {
  photoUrls: string[];
  photoIconUrl: string;
  mainPhotoIndex: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpInstance: any = null;
let sharpChecked = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSharp(): Promise<any | null> {
  if (sharpChecked) return sharpInstance;
  sharpChecked = true;
  try {
    // Dynamic import prevents sharp native binary crash at startup in serverless environments
    const mod = await import("sharp");
    sharpInstance = mod.default || mod;
    return sharpInstance;
  } catch (err) {
    console.warn("sharp library is not available in current runtime, falling back to raw media storage:", err);
    sharpInstance = null;
    return null;
  }
}

/**
 * Process uploaded files: AVIF gallery images + one tiny icon for the main photo.
 * Falls back to JPEG or raw storage if sharp/AVIF encoding fails.
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
  const sharp = await getSharp();

  for (let i = 0; i < images.length; i++) {
    const file = images[i]!;
    const input = Buffer.from(await file.arrayBuffer());

    // If sharp is not available (e.g. Lambda without native libvips), store raw image
    if (!sharp) {
      const ext = file.type.includes("png")
        ? "png"
        : file.type.includes("webp")
        ? "webp"
        : "jpg";
      const full = await storeMediaObject({
        key: `uploads/${listingId}/photo-${i + 1}.${ext}`,
        body: input,
        contentType: file.type || "image/jpeg",
      });
      photoUrls.push(full.url);
      if (i === clampedMain) {
        photoIconUrl = full.url;
      }
      continue;
    }

    let fullBuf: Buffer;
    let fullType = "image/avif";
    let fullExt = "avif";
    try {
      fullBuf = await sharp(input)
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .avif({ quality: 52, effort: 4 })
        .toBuffer();
    } catch {
      try {
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
      } catch {
        fullBuf = input;
        fullType = file.type || "image/jpeg";
        fullExt = "jpg";
      }
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
        iconBuf = await sharp(input)
          .rotate()
          .resize({ width: 72, height: 72, fit: "cover", position: "attention" })
          .avif({ quality: 38, effort: 4 })
          .toBuffer();
      } catch {
        try {
          iconBuf = await sharp(input)
            .rotate()
            .resize({ width: 72, height: 72, fit: "cover", position: "attention" })
            .jpeg({ quality: 70, mozjpeg: true })
            .toBuffer();
          iconType = "image/jpeg";
          iconExt = "jpg";
        } catch {
          iconBuf = fullBuf;
          iconType = fullType;
          iconExt = fullExt;
        }
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
