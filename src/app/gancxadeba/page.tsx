import type { Metadata } from "next";
import Link from "next/link";
import CreateListingForm from "@/components/CreateListingForm";

export const metadata: Metadata = {
  title: "განცხადების დამატება — იპოვე",
  description:
    "ატვირთე დაკარგული, ჩუქდება ან ნაპოვნი კატის/ძაღლის განცხადება რუკაზე.",
};

export default function CreateListingPage() {
  return (
    <div className="min-h-full bg-[linear-gradient(165deg,#e8f1ec_0%,#eef4f0_45%,#dce9e2_100%)]">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 md:px-8">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-ink md:text-2xl"
        >
          piu.ge
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-ink-soft transition hover:text-ink">
            რუკა
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 md:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-lake">
            ახალი განცხადება
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-ink md:text-4xl">
            დაამატე განცხადება რუკაზე
          </h1>
          <p className="mt-3 text-ink-soft">
            მიუთითე სტატუსი, ფოტო, ადგილი და კონტაქტი — განცხადება გამოჩნდება
            იმ წერტილზე, რომელსაც რუკაზე მონიშნავ.
          </p>
        </div>

        <CreateListingForm />
      </main>
    </div>
  );
}
