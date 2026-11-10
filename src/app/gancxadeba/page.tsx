import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CreateListingForm from "@/components/CreateListingForm";

export const metadata: Metadata = {
  title: "განცხადების დამატება — piu.ge",
  description:
    "ატვირთე დაკარგული, ჩუქდება ან ნაპოვნი კატის/ძაღლის განცხადება რუკაზე.",
};

export default function CreateListingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-10 pb-16">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/90 text-[var(--moss)] text-xs font-bold tracking-wide uppercase shadow-2xs">
            <span>🐾</span>
            <span>ახალი განცხადება</span>
          </div>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold leading-tight text-[var(--ink)] md:text-4xl">
            დაამატე განცხადება რუკაზე
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
            მიუთითე სტატუსი, ფოტო, ადგილი და საკონტაქტო ნომერი — განცხადება მყისიერად გამოჩნდება რუკაზე.
          </p>
        </div>

        <CreateListingForm />
      </main>

      <SiteFooter />
    </div>
  );
}
