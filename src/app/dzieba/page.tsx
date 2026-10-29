import type { Metadata } from "next";
import Link from "next/link";
import SearchConsole from "@/components/SearchConsole";

export const metadata: Metadata = {
  title: "ძებნა — იპოვე",
  description:
    "მოძებნე განცხადება სახელით, ტელეფონით, მისამართით, აღწერით ან თარიღით.",
};

export default function SearchPage() {
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
          <Link
            href="/gancxadeba"
            className="rounded-md bg-moss px-3 py-1.5 text-white transition hover:bg-leaf"
          >
            დამატება
          </Link>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 md:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-lake">
            საძიებო კონსოლი
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
            მოძებნე კონკრეტული განცხადება
          </h1>
          <p className="mt-3 text-ink-soft">
            ჩაწერე სახელი, ტელეფონი, მისამართი ან აღწერის ნაწილი — და საჭიროების
            შემთხვევაში დააზუსტე სტატუსი, ცხოველი ან პერიოდი.
          </p>
        </div>

        <SearchConsole variant="page" />
      </main>
    </div>
  );
}
