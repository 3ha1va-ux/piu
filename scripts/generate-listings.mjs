import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "src", "data");
const typesPath = path.join(dataDir, "listings-types.ts");
const dataPath = path.join(dataDir, "listings-data.ts");
const barrelPath = path.join(dataDir, "listings.ts");

const TONE_KIND = {
  lost: "დაკარგული",
  gift: "ჩუქდება",
  found: "ნაპოვნი",
};

const dogNames = [
  "ლუკა",
  "ტოლი",
  "მაქსი",
  "ბობი",
  "პატი",
  "რეი",
  "ტომი",
  "დიუკი",
  "სკოტი",
  "ჯიმი",
  "არი",
  "შარი",
  "რექსი",
  "ბარი",
  "ცეზარი",
  "ორი",
  "ფიდო",
  "ბენგი",
  "კუკი",
  "ზევსი",
];

const catNames = [
  "ლალი",
  "პისი",
  "ნინო",
  "მურა",
  "ირისი",
  "მია",
  "როზა",
  "დეიზი",
  "ფლორი",
  "ვასი",
  "ჩიტა",
  "მილკა",
  "სიმბა",
  "ნუში",
  "კიტი",
  "მარსა",
  "ლუნა",
  "პეპა",
  "გინგერი",
  "ცისი",
];

/** @type {{ place: string; lat: number; lng: number; dense?: boolean }[]} */
const locations = [
  { place: "თბილისი · ვაკე", lat: 41.7098, lng: 44.757, dense: true },
  { place: "თბილისი · საბურთალო", lat: 41.722, lng: 44.75, dense: true },
  { place: "თბილისი · ისანი", lat: 41.688, lng: 44.845, dense: true },
  { place: "თბილისი · ძველი თბილისი", lat: 41.6915, lng: 44.801, dense: true },
  { place: "თბილისი · გლდანი", lat: 41.79, lng: 44.82, dense: true },
  { place: "თბილისი · დიდუბე", lat: 41.74, lng: 44.785, dense: true },
  { place: "თბილისი · ვარკეთილი", lat: 41.685, lng: 44.87, dense: true },
  { place: "თბილისი · ორთაჭალა", lat: 41.675, lng: 44.825, dense: true },
  { place: "თბილისი · ლილო", lat: 41.68, lng: 44.95, dense: true },
  { place: "თბილისი · ნაძალადევი", lat: 41.76, lng: 44.79, dense: true },
  { place: "თბილისი · ვაშლიჯვარი", lat: 41.735, lng: 44.73, dense: true },
  { place: "თბილისი · ავლაბარი", lat: 41.695, lng: 44.815, dense: true },
  { place: "თბილისი · სანზონა", lat: 41.705, lng: 44.79, dense: true },
  { place: "თბილისი · მუხიანი", lat: 41.785, lng: 44.78, dense: true },
  { place: "თბილისი · დიღომი", lat: 41.765, lng: 44.74, dense: true },
  { place: "თბილისი · ვაზისუბანი", lat: 41.72, lng: 44.86, dense: true },
  { place: "ქუთაისი", lat: 42.2679, lng: 42.6946, dense: true },
  { place: "ქუთაისი · უბანი", lat: 42.255, lng: 42.71, dense: true },
  { place: "ქუთაისი · ავტოსადგური", lat: 42.26, lng: 42.68, dense: true },
  { place: "ქუთაისი · ბაღდათი", lat: 42.24, lng: 42.72, dense: true },
  { place: "ბათუმი · ცენტრი", lat: 41.6428, lng: 41.6337, dense: true },
  { place: "ბათუმი · ახალი ბულვარი", lat: 41.655, lng: 41.64, dense: true },
  { place: "ბათუმი · აგარა", lat: 41.635, lng: 41.66, dense: true },
  { place: "ბათუმი · მახინჯაური", lat: 41.675, lng: 41.695, dense: true },
  { place: "რუსთავი", lat: 41.5493, lng: 45, dense: true },
  { place: "რუსთავი · მე-2 მიკრო", lat: 41.56, lng: 45.02, dense: true },
  { place: "რუსთავი · მდინარე", lat: 41.54, lng: 44.99, dense: true },
  { place: "ზესტაფონი", lat: 42.11, lng: 43.05 },
  { place: "სამტრედია", lat: 42.16, lng: 42.34 },
  { place: "ჭიათურა", lat: 42.289, lng: 43.28 },
  { place: "ჭიათურა · მაღარო", lat: 42.295, lng: 43.29 },
  { place: "ქობულეთი", lat: 41.82, lng: 41.78 },
  { place: "ქობულეთი · სანაპირო", lat: 41.81, lng: 41.775 },
  { place: "ხელვაჩაური", lat: 41.585, lng: 41.67 },
  { place: "შუახევი", lat: 41.63, lng: 42.2 },
  { place: "ზუგდიდი", lat: 42.5088, lng: 41.8708 },
  { place: "ზუგდიდი · ბაზარი", lat: 42.5, lng: 41.88 },
  { place: "ზუგდიდი · რკინიგზა", lat: 42.515, lng: 41.86 },
  { place: "ფოთი", lat: 42.146, lng: 41.6719 },
  { place: "ფოთი · პორტი", lat: 42.155, lng: 41.66 },
  { place: "სენაკი", lat: 42.27, lng: 42.07 },
  { place: "სენაკი · ცენტრი", lat: 42.275, lng: 42.065 },
  { place: "ოზურგეთი", lat: 41.924, lng: 42 },
  { place: "ოზურგეთი · პარკი", lat: 41.93, lng: 41.995 },
  { place: "მარტვილი", lat: 42.414, lng: 42.378 },
  { place: "ლანჩხუთი", lat: 42.09, lng: 42.04 },
  { place: "ჩოხატაური", lat: 42.02, lng: 42.24 },
  { place: "აბაშა", lat: 42.2, lng: 42.2 },
  { place: "ხობი", lat: 42.315, lng: 41.9 },
  { place: "წალენჯიხა", lat: 42.615, lng: 42.07 },
  { place: "გორი", lat: 41.9842, lng: 44.1158 },
  { place: "გორი · ცენტრი", lat: 41.978, lng: 44.11 },
  { place: "მარნეული", lat: 41.475, lng: 44.81 },
  { place: "ქარელი", lat: 42.021, lng: 43.9 },
  { place: "ბოლნისი", lat: 41.448, lng: 44.542 },
  { place: "კასპი", lat: 41.925, lng: 44.42 },
  { place: "გარდაბანი", lat: 41.46, lng: 45.09 },
  { place: "თეთრიწყარო", lat: 41.465, lng: 44.47 },
  { place: "წალკა", lat: 41.595, lng: 44.09 },
  { place: "თელავი", lat: 41.9198, lng: 45.4731 },
  { place: "თელავი · პარკი", lat: 41.915, lng: 45.48 },
  { place: "გურჯაანი", lat: 41.745, lng: 45.8 },
  { place: "საგარეჯო", lat: 41.735, lng: 45.33 },
  { place: "ყვარელი", lat: 41.95, lng: 45.82 },
  { place: "ახმეტა", lat: 42.03, lng: 45.21 },
  { place: "წნორი", lat: 41.915, lng: 45.15 },
  { place: "თიანეთი", lat: 42.11, lng: 44.97 },
  { place: "დუშეთი", lat: 42.085, lng: 44.695 },
  { place: "მცხეთა", lat: 41.845, lng: 44.715 },
  { place: "გარდაბანი · ცენტრი", lat: 41.465, lng: 45.085 },
  { place: "ბორჯომი", lat: 41.85, lng: 43.38 },
  { place: "ახალციხე", lat: 41.639, lng: 42.982 },
  { place: "ახალციხე · ციხე", lat: 41.645, lng: 42.99 },
  { place: "ასპინძა", lat: 41.575, lng: 43.25 },
  { place: "ტყიბული", lat: 42.35, lng: 42.998 },
  { place: "წყალტუბო", lat: 42.327, lng: 42.6 },
  { place: "ვანი", lat: 42.085, lng: 42.52 },
  { place: "ხაშური", lat: 41.995, lng: 43.6 },
  { place: "სურამი", lat: 42.02, lng: 43.555 },
  { place: "სტეფანწმინდა", lat: 42.66, lng: 44.64 },
  { place: "ჯავა", lat: 42.39, lng: 43.92 },
  { place: "ცხინვალი", lat: 42.23, lng: 43.97 },
  { place: "მესტია", lat: 43.045, lng: 42.73 },
  { place: "ჭრებალო", lat: 42.63, lng: 43.28 },
  { place: "ფასანაური", lat: 42.35, lng: 44.69 },
  { place: "წალკა · ცენტრი", lat: 41.59, lng: 44.085 },
  { place: "წყნეთი", lat: 41.825, lng: 44.715 },
  { place: "კასპი · ცენტრი", lat: 41.92, lng: 44.425 },
  { place: "წალენჯიხა · ცენტრი", lat: 42.62, lng: 42.075 },
  { place: "ონი", lat: 42.58, lng: 43.44 },
  { place: "ამბროლაური", lat: 42.52, lng: 43.15 },
  { place: "ცაგერი", lat: 42.65, lng: 42.5 },
  { place: "წყალტუბო · მაღანათი", lat: 42.335, lng: 42.605 },
  { place: "ქუთაისი · ბაგრატი", lat: 42.272, lng: 42.702, dense: true },
  { place: "თბილისი · მთაწმინდა", lat: 41.697, lng: 44.789, dense: true },
  { place: "თბილისი · ჩუღურეთი", lat: 41.712, lng: 44.768, dense: true },
  { place: "თბილისი · სოლოლაკი", lat: 41.718, lng: 44.762, dense: true },
  { place: "ბათუმი · ბოტანიკური", lat: 41.648, lng: 41.648, dense: true },
  { place: "რუსთავი · მე-3 მიკრო", lat: 41.552, lng: 45.015, dense: true },
  { place: "თელავი · ბაზარი", lat: 41.922, lng: 45.468 },
  { place: "ზუგდიდი · ცენტრი", lat: 42.512, lng: 41.875 },
  { place: "გალი", lat: 42.628, lng: 41.738 },
  { place: "ოზურგეთი · ცენტრი", lat: 41.928, lng: 42.005 },
  { place: "ქობულეთი · ცენტრი", lat: 41.818, lng: 41.782 },
  { place: "საჩხერე", lat: 42.345, lng: 43.419 },
  { place: "ქარელი · ცენტრი", lat: 42.018, lng: 43.905 },
  { place: "გარდაცხევა", lat: 42.1, lng: 45.35 },
  { place: "დედოფლისწყარო", lat: 41.46, lng: 46.1 },
  { place: "ლაგოდეხი", lat: 41.825, lng: 46.275 },
  { place: "თბილისი · ნუცუბიძის", lat: 41.725, lng: 44.738, dense: true },
  { place: "თბილისი · რუსთავის გამზ.", lat: 41.692, lng: 44.828, dense: true },
];

const locs = locations;

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

function jitter(lat, lng, dense, seed) {
  const r = () => {
    const x = Math.sin(seed * 9999 + lat * 100) * 10000;
    return x - Math.floor(x);
  };
  if (dense) {
    return {
      lat: round4(lat + (r() - 0.5) * 0.06),
      lng: round4(lng + (r() * 0.618 - 0.309) * 0.06),
    };
  }
  return {
    lat: round4(lat + (r() - 0.5) * 0.012),
    lng: round4(lng + (r() * 0.5 - 0.25) * 0.012),
  };
}

const tones = [
  ...Array(1000).fill("lost"),
  ...Array(1000).fill("gift"),
  ...Array(1000).fill("found"),
];
function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260404);
for (let i = tones.length - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [tones[i], tones[j]] = [tones[j], tones[i]];
}

const typesContent = `export type ListingTone = "lost" | "gift" | "found";
export type AnimalType = "ძაღლი" | "კატა";
export type ListingKind = "დაკარგული" | "ჩუქდება" | "ნაპოვნი";

export type PetListing = {
  id: string;
  kind: ListingKind;
  animal: AnimalType;
  name: string;
  place: string;
  tone: ListingTone;
  lat: number;
  lng: number;
};

export const GEORGIA_CENTER: [number, number] = [42.05, 43.4];
export const GEORGIA_ZOOM = 7.2;
`;

const lines = [];
for (let i = 1; i <= 3000; i++) {
  const tone = tones[i - 1];
  const kind = TONE_KIND[tone];
  const animal = i % 2 === 1 ? "ძაღლი" : "კატა";
  const loc = locs[(i - 1) % locs.length];
  const { lat, lng } = jitter(loc.lat, loc.lng, loc.dense, i);
  let name;
  if (tone === "found") {
    name = "უცნობი";
  } else if (animal === "ძაღლი") {
    name = dogNames[(i - 1) % dogNames.length];
  } else {
    name = catNames[(i - 1) % catNames.length];
  }
  lines.push(
    `  { id: "${i}", kind: "${kind}", animal: "${animal}", name: "${name}", place: "${loc.place}", tone: "${tone}", lat: ${lat}, lng: ${lng} },`
  );
}

const dataContent = `import "server-only";

import type { PetListing } from "./listings-types";

/** Demo listings across Georgia — replace with real data later */
export const petListings: PetListing[] = [
${lines.join("\n")}
];
`;

const barrelContent = `export type { ListingTone, AnimalType, ListingKind, PetListing } from "./listings-types";
export { GEORGIA_CENTER, GEORGIA_ZOOM } from "./listings-types";
export { petListings } from "./listings-data";
`;

const existingTypes = fs.existsSync(typesPath)
  ? fs.readFileSync(typesPath, { encoding: "utf8" })
  : null;
if (existingTypes !== typesContent) {
  if (existingTypes === null) {
    fs.writeFileSync(typesPath, typesContent, { encoding: "utf8" });
  } else {
    console.warn(
      "listings-types.ts exists with different content; left unchanged"
    );
  }
}

fs.writeFileSync(dataPath, dataContent, { encoding: "utf8" });
fs.writeFileSync(barrelPath, barrelContent, { encoding: "utf8" });

const counts = { lost: 0, gift: 0, found: 0 };
for (const t of tones) counts[t]++;
const idMatches = dataContent.match(/id: "/g)?.length ?? 0;
const hasReplacement = dataContent.includes("\uFFFD");
console.log(
  JSON.stringify(
    { idMatches, counts, hasReplacement, typesPath, dataPath, barrelPath },
    null,
    2
  )
);
