import type { AnimalType, ListingTone } from "@/data/listings-types";

/** Status colors: lost = red, gift = yellow, found = green */
export const TONE_COLORS = {
  lost: {
    pin: "#e23a3a",
    labelBg: "#f7d4d4",
    labelText: "#8f2a2a",
  },
  gift: {
    pin: "#e6b422",
    labelBg: "#f7edd0",
    labelText: "#7a5c10",
  },
  found: {
    pin: "#2f5f45",
    labelBg: "#d5e8db",
    labelText: "#1f4632",
  },
} as const;

export const TONE_LABELS: Record<ListingTone, string> = {
  lost: "დაკარგული",
  gift: "ჩუქდება",
  found: "ნაპოვნი",
};

/** Kept for filter dots / secondary UI accents */
export const ANIMAL_COLORS = {
  ძაღლი: "#c4782b",
  კატა: "#2a6f7a",
} as const satisfies Record<AnimalType, string>;

export function animalColor(animal: AnimalType): string {
  return ANIMAL_COLORS[animal];
}

export function toneColor(tone: ListingTone): string {
  return TONE_COLORS[tone].pin;
}

export function markerCaption(animal: AnimalType, tone: ListingTone): string {
  return `${TONE_LABELS[tone]} ${animal}`;
}

export function markerVisual(animal: AnimalType, tone: ListingTone) {
  const palette = TONE_COLORS[tone];
  return {
    color: palette.pin,
    background: palette.pin,
    borderColor: palette.pin,
    label: animal === "ძაღლი" ? "ძ" : "კ",
    caption: markerCaption(animal, tone),
    labelBg: palette.labelBg,
    labelText: palette.labelText,
  };
}

/**
 * Animal glyph inside the pin — shapes must read clearly at map scale.
 * Dog = circle, cat = inverted triangle (point down).
 */
function animalGlyph(animal: AnimalType): string {
  // Pin head center ≈ (14, 13.2) — both glyphs share that visual midpoint
  if (animal === "ძაღლი") {
    return `<circle cx="14" cy="13.2" r="6.2" fill="#ffffff"/>`;
  }
  // Inverted triangle: centroid at ~13.2 so it sits centered in the bulb
  return `<path fill="#ffffff" d="M7.5 9.4 L20.5 9.4 L14 20.8 Z"/>`;
}

/**
 * Design pin: red / yellow / green teardrop + animal shape (no under-label — keeps map readable).
 * tipY = pin tip offset from top (for iconAnchor).
 */
export function mapPinHtml(
  animal: AnimalType,
  tone: ListingTone,
  active: boolean,
): { html: string; width: number; height: number; tipY: number } {
  const visual = markerVisual(animal, tone);
  const scale = active ? 1.1 : 1;
  const width = Math.round(30 * scale);
  const height = Math.round(40 * scale);
  const tipY = height;
  const glyph = animalGlyph(animal);

  const html = `<div style="width:${width}px;height:${height}px;filter:drop-shadow(0 3px 8px rgba(20,32,28,0.28));">
  <svg width="${width}" height="${height}" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block;overflow:visible;">
    <path d="M14 39.2 C14 39.2 2.2 24.5 2.2 13.2 C2.2 6.5 7.5 1.2 14 1.2 C20.5 1.2 25.8 6.5 25.8 13.2 C25.8 24.5 14 39.2 14 39.2 Z" fill="${visual.background}"/>
    ${glyph}
  </svg>
</div>`;

  return { html, width, height, tipY };
}
