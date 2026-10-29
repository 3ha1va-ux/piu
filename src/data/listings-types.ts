export type ListingTone = "lost" | "gift" | "found";
export type AnimalType = "ძაღლი" | "კატა";
export type ListingKind = "დაკარგული" | "ჩუქდება" | "ნაპოვნი";
export type PetSex = "მამალი" | "მდედრი" | "უცნობი";
export type TriState = "კი" | "არა" | "უცნობი";

export type PetListing = {
  id: string;
  kind: ListingKind;
  animal: AnimalType;
  name: string;
  place: string;
  tone: ListingTone;
  lat: number;
  lng: number;
  description?: string;
  /** Gallery images (compressed AVIF/JPEG on upload). */
  photoUrls?: string[];
  /** Tiny (~5–10KB) cover icon for sidebar / search lists. */
  photoIconUrl?: string;
  /** Index into photoUrls for the cover / main photo (default 0). */
  mainPhotoIndex?: number;
  videoUrl?: string;
  sex?: PetSex;
  color?: string;
  breed?: string;
  age?: string;
  hasCollar?: TriState;
  hasChip?: TriState;
  reward?: string;
  eventDate?: string;
  contactPhone?: string;
  contactName?: string;
  contactSocial?: string;
  createdAt?: string;
};

export type CreateListingPayload = {
  tone: ListingTone;
  animal: AnimalType;
  name: string;
  place: string;
  lat: number;
  lng: number;
  description?: string;
  sex?: PetSex;
  color?: string;
  breed?: string;
  age?: string;
  hasCollar?: TriState;
  hasChip?: TriState;
  reward?: string;
  eventDate?: string;
  contactPhone: string;
  contactName?: string;
  contactSocial?: string;
};

export type ListingSort =
  | "created_desc"
  | "created_asc"
  | "event_desc"
  | "event_asc";

export const LISTING_SORTS: ListingSort[] = [
  "created_desc",
  "created_asc",
  "event_desc",
  "event_asc",
];

export type MapBBox = {
  west: number;
  south: number;
  east: number;
  north: number;
};

export type ToneCounts = Record<ListingTone, number>;

export type ServerCluster = {
  id: string;
  lat: number;
  lng: number;
  count: number;
  tones: ToneCounts;
};

export type ListingsQueryResult = {
  totalMatched: number;
  mode: "grid" | "points";
  items: PetListing[];
  clusters: ServerCluster[];
};

/**
 * პირველი ჩატვირთვის ცენტრი: [განედი lat, გრძედი lng]
 * ყველა ეკრანზე იგივე camera — GEORGIA_ZOOM-თან ერთად.
 *
 * ზემოთ / დაბლა  → lat: გაზრდა = დაბლა, შემცირება = ზემოთ
 * მარცხნივ / მარჯვნივ → lng: გაზრდა = მარჯვნივ, შემცირება = მარცხნივ
 */
export const GEORGIA_CENTER: [number, number] = [42.3, 43.3];

/**
 * პირველი ჩატვირთვის zoom — ყველა ეკრანზე ერთი და იგივე.
 * ასე საქართველო ვიზუალურად ერთნაირი ზომისაა (არა fitBounds).
 * გაზრდა = უფრო ახლოს. მარტივი გზა: მაუსით მოარგე → „ეს ხედი შეინახე“.
 */
export const GEORGIA_ZOOM = 8.5;

/**
 * რუკის გადაადგილების ლიმიტი (maxBounds) — აქედან გარეთ აღარ მიდის.
 * ფორმატი: [[სამხრეთი lat, დასავლეთი lng], [ჩრდილოეთი lat, აღმოსავლეთი lng]]
 *
 * უფრო ფართო არეალი  → შეამცირე სამხრეთი/დასავლეთი, გაზარდე ჩრდილოეთი/აღმოსავლეთი
 * უფრო ვიწრო არეალი  → პირიქით (უფრო მჭიდრო ყუთი)
 *
 * მაგალითი ფართოდ: [[40.0, 38.5], [44.5, 48.0]]
 * მაგალითი ვიწროდ: [[41.0, 41.0], [43.0, 46.0]]
 */
export const GEORGIA_MAX_BOUNDS: [[number, number], [number, number]] = [
  [40.4, 38.5],
  [44.2, 48.0],
];

/**
 * რამდენად „მაგრად“ ეკვრის საზღვარს (0 = თავისუფალი, 1 = მთლიანად ჩაკეტილი).
 * სცადე 0.5 / 0.85 / 1
 */
export const GEORGIA_MAX_BOUNDS_VISCOSITY = 0.85;

/**
 * სარეზერვო ჩარჩო (SW → NE). პირველ ჩატვირთვას აღარ აკონტროლებს —
 * იხ. GEORGIA_CENTER + GEORGIA_ZOOM.
 */
export const GEORGIA_BOUNDS: [[number, number], [number, number]] = [
  [41.05, 39.85],
  [43.58, 46.85],
];

/** დატოვებულია თავსებადობისთვის; ჩატვირთვაზე აღარ გამოიყენება */
export const GEORGIA_FIT_PADDING: [number, number] = [10, 10];