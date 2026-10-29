/** Common Georgia places for instant address suggestions */
export type GeorgiaPlace = {
  label: string;
  place: string;
  lat: number;
  lng: number;
  /** Leaflet zoom — city ≈ 12, district ≈ 14.5 */
  zoom: number;
  /** Optional [west, south, east, north] for fitBounds */
  bbox?: [number, number, number, number];
};

const CITY = 12;
const DISTRICT = 14.5;

export const GEORGIA_PLACES: GeorgiaPlace[] = [
  {
    label: "თბილისი",
    place: "თბილისი",
    lat: 41.7151,
    lng: 44.8271,
    zoom: CITY,
    bbox: [44.7, 41.65, 44.95, 41.84],
  },
  {
    label: "ავლაბარი",
    place: "თბილისი · ავლაბარი",
    lat: 41.6915,
    lng: 44.8165,
    zoom: DISTRICT,
    bbox: [44.8, 41.68, 44.835, 41.705],
  },
  {
    label: "ვაკე",
    place: "თბილისი · ვაკე",
    lat: 41.7085,
    lng: 44.758,
    zoom: DISTRICT,
    bbox: [44.73, 41.69, 44.78, 41.73],
  },
  {
    label: "საბურთალო",
    place: "თბილისი · საბურთალო",
    lat: 41.722,
    lng: 44.748,
    zoom: DISTRICT,
    bbox: [44.72, 41.7, 44.78, 41.75],
  },
  {
    label: "ისანი",
    place: "თბილისი · ისანი",
    lat: 41.688,
    lng: 44.852,
    zoom: DISTRICT,
  },
  {
    label: "გლდანი",
    place: "თბილისი · გლდანი",
    lat: 41.798,
    lng: 44.825,
    zoom: DISTRICT,
  },
  {
    label: "დიდუბე",
    place: "თბილისი · დიდუბე",
    lat: 41.755,
    lng: 44.79,
    zoom: DISTRICT,
  },
  {
    label: "ნაძალადევი",
    place: "თბილისი · ნაძალადევი",
    lat: 41.735,
    lng: 44.775,
    zoom: DISTRICT,
  },
  {
    label: "ვარკეთილი",
    place: "თბილისი · ვარკეთილი",
    lat: 41.685,
    lng: 44.88,
    zoom: DISTRICT,
  },
  {
    label: "დიღომი",
    place: "თბილისი · დიღომი",
    lat: 41.77,
    lng: 44.74,
    zoom: DISTRICT,
  },
  {
    label: "ორთაჭალა",
    place: "თბილისი · ორთაჭალა",
    lat: 41.678,
    lng: 44.825,
    zoom: DISTRICT,
  },
  {
    label: "მთაწმინდა",
    place: "თბილისი · მთაწმინდა",
    lat: 41.696,
    lng: 44.79,
    zoom: DISTRICT,
  },
  {
    label: "ვერა",
    place: "თბილისი · ვერა",
    lat: 41.705,
    lng: 44.78,
    zoom: DISTRICT,
  },
  {
    label: "ჩუღურეთი",
    place: "თბილისი · ჩუღურეთი",
    lat: 41.71,
    lng: 44.81,
    zoom: DISTRICT,
  },
  {
    label: "სამგორი",
    place: "თბილისი · სამგორი",
    lat: 41.68,
    lng: 44.9,
    zoom: DISTRICT,
  },
  {
    label: "ლილო",
    place: "თბილისი · ლილო",
    lat: 41.69,
    lng: 44.96,
    zoom: DISTRICT,
  },
  {
    label: "ქუთაისი",
    place: "ქუთაისი",
    lat: 42.2679,
    lng: 42.6946,
    zoom: CITY,
    bbox: [42.62, 42.22, 42.78, 42.32],
  },
  {
    label: "ბათუმი",
    place: "ბათუმი",
    lat: 41.6168,
    lng: 41.6367,
    zoom: CITY,
    bbox: [41.58, 41.58, 41.68, 41.67],
  },
  {
    label: "რუსთავი",
    place: "რუსთავი",
    lat: 41.5495,
    lng: 44.9932,
    zoom: CITY,
  },
  {
    label: "ზუგდიდი",
    place: "ზუგდიდი",
    lat: 42.5088,
    lng: 41.8709,
    zoom: CITY,
  },
  {
    label: "გორი",
    place: "გორი",
    lat: 41.9842,
    lng: 44.1158,
    zoom: CITY,
  },
  {
    label: "ფოთი",
    place: "ფოთი",
    lat: 42.146,
    lng: 41.672,
    zoom: CITY,
  },
  {
    label: "თელავი",
    place: "თელავი",
    lat: 41.9198,
    lng: 45.4732,
    zoom: CITY,
  },
  {
    label: "მცხეთა",
    place: "მცხეთა",
    lat: 41.8451,
    lng: 44.72,
    zoom: DISTRICT,
  },
  {
    label: "ქობულეთი",
    place: "ქობულეთი",
    lat: 41.8214,
    lng: 41.7753,
    zoom: CITY,
  },
  {
    label: "ახალციხე",
    place: "ახალციხე",
    lat: 41.639,
    lng: 42.986,
    zoom: CITY,
  },
  {
    label: "მარნეული",
    place: "მარნეული",
    lat: 41.4756,
    lng: 44.8108,
    zoom: CITY,
  },
  {
    label: "სენაკი",
    place: "სენაკი",
    lat: 42.2706,
    lng: 42.0678,
    zoom: CITY,
  },
  {
    label: "ოზურგეთი",
    place: "ოზურგეთი",
    lat: 41.9244,
    lng: 42.0058,
    zoom: CITY,
  },
  {
    label: "ხაშური",
    place: "ხაშური",
    lat: 41.994,
    lng: 43.599,
    zoom: CITY,
  },
  {
    label: "ბორჯომი",
    place: "ბორჯომი",
    lat: 41.844,
    lng: 43.383,
    zoom: CITY,
  },
  {
    label: "წყალტუბო",
    place: "წყალტუბო",
    lat: 42.326,
    lng: 42.599,
    zoom: CITY,
  },
  {
    label: "საგარეჯო",
    place: "საგარეჯო",
    lat: 41.7338,
    lng: 45.3315,
    zoom: CITY,
  },
  {
    label: "გურჯაანი",
    place: "გურჯაანი",
    lat: 41.7429,
    lng: 45.789,
    zoom: CITY,
  },
];

export function searchLocalPlaces(query: string, limit = 8): GeorgiaPlace[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return GEORGIA_PLACES.filter(
    (p) =>
      p.label.toLowerCase().includes(q) || p.place.toLowerCase().includes(q),
  ).slice(0, limit);
}
