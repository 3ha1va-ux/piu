import type { ListingTone, PetSex, TriState } from "@/data/listings-types";

export const FORM_STEPS = [
  { id: 1, title: "ტიპი", hint: "რა შემთხვევაა და რა ცხოველია" },
  { id: 2, title: "აღწერა", hint: "ფოტო, ნიშნები და დეტალები" },
  { id: 3, title: "ადგილი", hint: "სად დაიკარგა / მონიშნე რუკაზე" },
  { id: 4, title: "კონტაქტი", hint: "როგორ დაგიკავშირდნენ" },
] as const;

export const TRI_STATE_OPTIONS: TriState[] = ["კი", "არა", "უცნობი"];

export type ListingFormState = {
  tone: ListingTone | null;
  animal: "ძაღლი" | "კატა" | null;
  name: string;
  description: string;
  sex: PetSex | "";
  color: string;
  breed: string;
  age: string;
  hasCollar: TriState | "";
  hasChip: TriState | "";
  reward: string;
  eventDate: string;
  place: string;
  lat: number | null;
  lng: number | null;
  contactName: string;
  contactPhone: string;
  contactSocial: string;
  photos: File[];
  /** Cover photo index; first uploaded photo is main until user changes it. */
  mainPhotoIndex: number;
  video: File | null;
};

export function emptyListingForm(): ListingFormState {
  return {
    tone: null,
    animal: null,
    name: "",
    description: "",
    sex: "",
    color: "",
    breed: "",
    age: "",
    hasCollar: "",
    hasChip: "",
    reward: "",
    eventDate: new Date().toISOString().slice(0, 10),
    place: "",
    lat: null,
    lng: null,
    contactName: "",
    contactPhone: "",
    contactSocial: "",
    photos: [],
    mainPhotoIndex: 0,
    video: null,
  };
}

export function placeFieldLabel(tone: ListingTone | null): string {
  if (tone === "lost") return "ბოლოს სად ნახეს *";
  if (tone === "found") return "სად იპოვე *";
  return "ქალაქი / უბანი *";
}

export function marksFieldLabel(tone: ListingTone | null): string {
  if (tone === "lost") return "განსაკუთრებული ნიშნები";
  if (tone === "found") return "როგორ გამოიყურება";
  return "აღწერა";
}

export function validateStep(
  step: number,
  form: ListingFormState,
): string | null {
  if (step === 1) {
    if (!form.tone) return "აირჩიე სტატუსი: დაკარგული, ჩუქდება ან ნაპოვნი";
    if (!form.animal) return "აირჩიე სახეობა: ძაღლი ან კატა";
    return null;
  }

  if (step === 2) {
    if (form.photos.length === 0) return "ატვირთე მინიმუმ ერთი ფოტო";
    if (form.tone === "gift" && !form.name.trim()) {
      return "მიუთითე ცხოველის სახელი";
    }
    if (form.video && form.video.size > 40_000_000) {
      return "ვიდეო მაქსიმუმ 40MB უნდა იყოს";
    }
    return null;
  }

  if (step === 3) {
    if (!form.place.trim()) {
      return form.tone === "lost"
        ? "მიუთითე, ბოლოს სად ნახეს"
        : "მიუთითე ქალაქი ან უბანი";
    }
    if (form.lat == null || form.lng == null) {
      return "რუკაზე დააჭირე იმ ადგილს, სადაც მოხდა შემთხვევა";
    }
    if (form.tone === "lost" && !form.eventDate) {
      return "მიუთითე დაკარგვის თარიღი";
    }
    return null;
  }

  if (step === 4) {
    const digits = form.contactPhone.replace(/\D/g, "");
    if (digits.length < 9) return "მიუთითე სწორი ტელეფონის ნომერი";
    return null;
  }

  return null;
}

/** Resize/compress image in the browser before upload */
export async function preparePhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size < 350_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
    });
  } catch {
    // HEIC/HEIF or other unsupported formats — upload original as-is.
    return file;
  }
}
