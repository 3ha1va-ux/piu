import Link from "next/link";
import MapExperience from "@/components/MapExperience";

const steps = [
  {
    n: "01",
    title: "განცხადება",
    text: "ატვირთე ფოტო და მონიშნე ადგილი რუკაზე — დაკარგული, ჩუქდება ან ნაპოვნი.",
  },
  {
    n: "02",
    title: "რუკა",
    text: "ნახე ყველა შემთხვევა საქართველოში და გაფილტრე ტიპით.",
  },
  {
    n: "03",
    title: "შეხვედრა",
    text: "დაუკავშირდი მეორე მხარეს და დააბრუნე შინაური სახლში.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <MapExperience />

        {/* Desktop-only marketing — mobile stays map-app chrome */}
        <section
          id="how"
          className="section-wash hidden px-5 py-20 md:block md:px-8 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-lake">
              პროცესი
            </p>
            <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
              რუკა არის მთავარი
            </h2>
            <p className="mt-3 max-w-lg text-ink-soft">
              ყველა განცხადება ჩანს რუკაზე — ძებნა იწყება იქიდან, სადაც ცხოველი
              დაიკარგა ან მოიძებნა.
            </p>

            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {steps.map((step) => (
                <li key={step.n} className="relative">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-semibold text-mist">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="cta"
          className="hidden bg-paper px-5 py-20 md:block md:px-8 md:py-28"
        >
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-ink md:text-4xl">
              დაამატე განცხადება რუკაზე
            </h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              ატვირთე ფოტო, მონიშნე ადგილი და დატოვე კონტაქტი — განცხადება
              გამოჩნდება რუკაზე.
            </p>
            <Link
              href="/gancxadeba"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-moss px-6 font-semibold text-white transition hover:bg-leaf"
            >
              განცხადების დამატება
            </Link>
          </div>
        </section>
      </main>

      <footer className="hidden border-t border-moss/10 bg-paper px-5 py-8 md:block md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-ink">
            piu.ge
          </p>
          <p className="text-sm text-ink-soft">
            დაკარგული · ჩუქდება · ნაპოვნი · რუკა · საქართველო
          </p>
        </div>
      </footer>
    </div>
  );
}
