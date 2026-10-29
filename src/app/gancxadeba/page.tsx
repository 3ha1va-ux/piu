import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import CreateListingForm from "@/components/CreateListingForm";

export const metadata: Metadata = {
  title: "განცხადების დამატება — piu.ge",
  description:
    "ატვირთე დაკარგული, ჩუქდება ან ნაპოვნი კატის/ძაღლის განცხადება რუკაზე.",
};

export default function CreateListingPage() {
  return (
    <div className="min-h-full bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 pb-16 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[var(--lake)]">
            ახალი განცხადება
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold leading-tight text-[var(--ink)] md:text-4xl">
            დაამატე განცხადება რუკაზე
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[var(--ink-soft)]">
            მიუთითე სტატუსი, ფოტო, ადგილი და კონტაქტი — განცხადება გამოჩნდება
            იმ წერტილზე, რომელსაც რუკაზე მონიშნავ.
          </p>
        </div>

        <CreateListingForm />
      </main>
    </div>
  );
}
