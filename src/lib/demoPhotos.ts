import type {
  AnimalType,
  PetListing,
  PetSex,
  TriState,
} from "@/data/listings-types";

/** Shared demo stock photos (downloaded under /public/demo) */
export const DEMO_PHOTOS = [
  "/demo/dog-1.jpg",
  "/demo/dog-2.jpg",
  "/demo/dog-3.jpg",
  "/demo/cat-1.jpg",
  "/demo/cat-2.jpg",
  "/demo/cat-3.jpg",
] as const;

const DOG_PHOTOS = [
  "/demo/dog-1.jpg",
  "/demo/dog-2.jpg",
  "/demo/dog-3.jpg",
] as const;

const CAT_PHOTOS = [
  "/demo/cat-1.jpg",
  "/demo/cat-2.jpg",
  "/demo/cat-3.jpg",
] as const;

/** Tiny list icons generated from demo photos (`scripts/generate-demo-icons.mjs`). */
function demoIconFor(photoUrl: string): string {
  const base = photoUrl.replace(/^\/demo\//, "").replace(/\.\w+$/, "");
  return `/demo/icons/${base}.avif`;
}

const DOG_BREEDS = ["მეტისი", "ლაბრადორი", "გერმანული ნაგაზი", "ბიგლი", "ჰასკი"];
const CAT_BREEDS = ["მეტისი", "სიამური", "ბრიტანული", "სპარსული", "მეინ-კუნი"];
const DOG_COLORS = ["შავი", "ყავისფერი", "შავ-თეთრი", "ოქროსფერი", "ნაცრისფერი"];
const CAT_COLORS = ["ნარინჯისფერი", "შავი", "თეთრი", "ტაბი", "ნაცრისფერი"];
const AGES = ["3 თვე", "6 თვე", "1 წელი", "2 წელი", "4 წელი", "7 წელი"];
const SEXES: PetSex[] = ["მამალი", "მდედრი", "უცნობი"];
const TRI: TriState[] = ["კი", "არა", "უცნობი"];
const NAMES = ["ნინო", "გიორგი", "მარიამი", "ლაშა", "ანა", "დავითი"];

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

function pick<T>(seed: number, list: readonly T[], offset = 0): T {
  return list[(seed + offset) % list.length]!;
}

function demoDate(seed: number, daysAgoBase: number): string {
  const d = new Date();
  d.setDate(d.getDate() - (daysAgoBase + (seed % 40)));
  return d.toISOString().slice(0, 10);
}

function demoDescription(listing: PetListing, seed: number): string {
  if (listing.tone === "lost") {
    return pick(seed, [
      "ბოლოს ნანახი იყო ეზოსთან. მშვიდი ხასიათი აქვს, ადამიანს უახლოვდება.",
      "გაიქცა სეირნობისას. ყელსაბამი ჰქონდა, ძალიან მეგობრულია.",
      "სახლიდან გავიდა და აღარ დაბრუნებულა. გამოეხმაურება სახელს.",
    ]);
  }
  if (listing.tone === "found") {
    return pick(seed, [
      "ნაპოვნია ქუჩაში, გამოკვება სჭირდება. დროებით ჩვენთანაა.",
      "იპოვეთ პარკთან. შეშინებული ჩანს, მაგრამ კონტაქტზე მოდის.",
      "ნაპოვნია გზის პირას. ვეძებთ პატრონს ან დროებით სახლს.",
    ]);
  }
  return pick(seed, [
    "ძალიან მოსიყვარულეა, ეძებს კარგ სახლს. აცრილია.",
    "ბავშვებთან თავსებადია. საჭიროებს ყურადღებიან პატრონს.",
    "ჯანმრთელი და აქტიური. გადავცემთ პასუხისმგებელ ოჯახს.",
  ]);
}

/** Pick 4 photo URLs for a listing from the demo set */
export function demoPhotoUrlsFor(
  id: string,
  animal: AnimalType,
): string[] {
  const primary = animal === "ძაღლი" ? DOG_PHOTOS : CAT_PHOTOS;
  const secondary = animal === "ძაღლი" ? CAT_PHOTOS : DOG_PHOTOS;
  const start = seedFromId(id) % primary.length;
  const fourth = secondary[seedFromId(id) % secondary.length];
  return [
    primary[start % primary.length],
    primary[(start + 1) % primary.length],
    primary[(start + 2) % primary.length],
    fourth,
  ];
}

/**
 * Fill empty optional fields with stable demo data so detail pages
 * show breed/age/contact/etc. Real uploaded values are never overwritten.
 */
export function withDemoDetails(listing: PetListing): PetListing {
  const seed = seedFromId(listing.id);
  const isDog = listing.animal === "ძაღლი";
  const breeds = isDog ? DOG_BREEDS : CAT_BREEDS;
  const colors = isDog ? DOG_COLORS : CAT_COLORS;

  return {
    ...listing,
    description: listing.description ?? demoDescription(listing, seed),
    sex: listing.sex ?? pick(seed, SEXES),
    color: listing.color ?? pick(seed, colors, 1),
    breed: listing.breed ?? pick(seed, breeds, 2),
    age: listing.age ?? pick(seed, AGES, 3),
    hasCollar: listing.hasCollar ?? pick(seed, TRI, 4),
    hasChip: listing.hasChip ?? pick(seed, TRI, 5),
    reward:
      listing.reward ??
      (listing.tone === "lost"
        ? pick(seed, ["50 ლარი", "100 ლარი", "მადლობა", "200 ლარი"], 6)
        : undefined),
    eventDate: listing.eventDate ?? demoDate(seed, 3),
    createdAt: listing.createdAt ?? demoDate(seed, 1),
    contactName: listing.contactName ?? pick(seed, NAMES, 7),
    contactPhone:
      listing.contactPhone ??
      `5${String(50 + (seed % 49)).padStart(2, "0")} ${String(10 + (seed % 80)).padStart(2, "0")} ${String(10 + ((seed >> 3) % 80)).padStart(2, "0")} ${String(10 + ((seed >> 5) % 80)).padStart(2, "0")}`,
    contactSocial:
      listing.contactSocial ??
      pick(
        seed,
        [
          "facebook.com/demo.user",
          "Viber: 599 11 22 33",
          "Telegram: @demo_pet",
        ],
        8,
      ),
  };
}

/** Attach demo photos + details when missing (real uploads keep theirs) */
export function withDemoPhotos(listing: PetListing): PetListing {
  const withFields = withDemoDetails(listing);
  if (withFields.photoUrls && withFields.photoUrls.length > 0) {
    if (withFields.photoIconUrl) return withFields;
    const main =
      withFields.photoUrls[
        Math.min(
          Math.max(0, withFields.mainPhotoIndex ?? 0),
          withFields.photoUrls.length - 1,
        )
      ] ?? withFields.photoUrls[0];
    if (main?.startsWith("/demo/")) {
      return {
        ...withFields,
        photoIconUrl: demoIconFor(main),
        mainPhotoIndex: withFields.mainPhotoIndex ?? 0,
      };
    }
    return withFields;
  }
  const photoUrls = demoPhotoUrlsFor(listing.id, listing.animal);
  return {
    ...withFields,
    photoUrls,
    mainPhotoIndex: 0,
    photoIconUrl: demoIconFor(photoUrls[0]!),
  };
}

export function withDemoPhotosList(listings: PetListing[]): PetListing[] {
  return listings.map(withDemoPhotos);
}
