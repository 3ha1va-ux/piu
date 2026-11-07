import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "წესები და უსაფრთხოება — piu.ge",
  description:
    "piu.ge-ს გამოყენების წესები, განცხადების განთავსების პირობები და თაღლითებისგან თავდაცვის უსაფრთხოების გზამკვლევი.",
};

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-12">
          {/* Header */}
          <div className="border-b border-[var(--mist)] pb-6 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--moss)]">
              გზამკვლევი & პირობები
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--ink)] mt-1.5">
              საიტის წესები და უსაფრთხოება
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-2">
              გთხოვთ ყურადღებით გაეცნოთ წესებს, რათა თქვენი და თქვენი შინაური ცხოველის უსაფრთხოება იყოს 100%-ით დაცული.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
            {/* ALERT BOX: SCAM WARNING */}
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
              <div className="flex items-center gap-2 font-bold text-base sm:text-lg text-amber-900">
                <span className="text-2xl">⚠️</span>
                <span>მნიშვნელოვანი გაფრთხილება: თავდაცვა თაღლითებისგან!</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-amber-900">
                დაკარგული ცხოველების პატრონების ემოციური მდგომარეობით ხშირად სარგებლობენ თაღლითები. დაიცავით ეს 3 ოქროს წესი:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm font-medium text-amber-950">
                <li>
                  <strong>არასდროს გადარიცხოთ ჯილდო ან თანხა წინასწარ!</strong> (არც საბანკო ბარათზე და არც სწრაფი გადახდის აპარატით).
                </li>
                <li>
                  <strong>ჯილდო გადაეცით მხოლოდ პირისპირ:</strong> ჯილდოს გადაცემა ხდება მხოლოდ მას შემდეგ, რაც თქვენს ცხოველს საკუთარი თვალით ნახავთ და ჩაიბარებთ.
                </li>
                <li>
                  <strong>მოითხოვეთ რეალური დასტური:</strong> თუ ვინმე გეუბნებათ, რომ ცხოველი იპოვა, სთხოვეთ ახალი ფოტოს ან მოკლე ვიდეოს გამოგზავნა კონკრეტული ნიშნით (მაგ. „დაუძახეთ სახელით“ ან „მაჩვენეთ ყურის ნიშანი“).
                </li>
              </ul>
            </div>

            {/* Section 1: Posting Rules */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>📝</span>
                <span>1. განცხადების განთავსების წესები</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--ink-soft)]">
                <li>
                  <strong>მხოლოდ უანგარო დახმარება და გაჩუქება:</strong> piu.ge-ზე კატეგორიულად <strong>იკრძალება ცხოველებით კომერციული ვაჭრობა</strong> და გასაყიდი განცხადებების განთავსება. საიტი ემსახურება მხოლოდ დაკარგულ, ნაპოვნ და უსასყიდლოდ ჩუქებად ცხოველებს.
                </li>
                <li>
                  <strong>ზუსტი ლოკაცია:</strong> მიუთითეთ რაც შეიძლება ზუსტი ადგილი რუკაზე, სადაც ცხოველი ბოლოს ნახეთ, რათა მეზობლებმა და მიმდებარედ მყოფმა ადამიანებმა დროულად შენიშნონ.
                </li>
                <li>
                  <strong>რეალური ფოტოები:</strong> ატვირთეთ ცხოველის მკაფიო, რეალური ფოტო. არ გამოიყენოთ ინტერნეტიდან აღებული უცხო სურათები.
                </li>
                <li>
                  <strong>სპამის აკრძალვა:</strong> 1 მომხმარებლის მიერ ერთი და იმავე ცხოველის განცხადების ხელოვნურად გამრავლება (დუბლიკატები) იკრძალება.
                </li>
              </ul>
            </section>

            {/* Section 2: Safe Meetings */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>🤝</span>
                <span>2. უსაფრთხო შეხვედრა და ცხოველის გადაცემა</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--ink-soft)]">
                <li>
                  <strong>შეხვედრის ადგილი:</strong> მპოვნელთან ან ახალ პატრონთან შეხვედრა დაგეგმეთ <strong>ხალხმრავალ, განათებულ ადგილას</strong> (მაგალითად: ვეტერინარულ კლინიკასთან, სავაჭრო ცენტრთან ან მეტროსადგურთან).
                </li>
                <li>
                  <strong>ჩიპის შემოწმება:</strong> თუ იპოვეთ დაკარგული ცხოველი, უახლოეს ვეტ-კლინიკაში შეგიძლიათ <strong>უფასოდ დაასკანეროთ ჩიპი</strong>, სადაც ჩაწერილია პატრონის ნომერი.
                </li>
                <li>
                  <strong>თან წაიყვანეთ ახლობელი:</strong> უცნობ პირთან შეხვედრისას რეკომენდებულია თან ახლდეს ოჯახის წევრი ან მეგობარი.
                </li>
              </ul>
            </section>

            {/* Section 3: Status Updates */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>🎉</span>
                <span>3. განცხადების სტატუსის განახლება</span>
              </h2>
              <p className="text-[var(--ink-soft)]">
                როგორც კი თქვენი ცხოველი დაბრუნდება სახლში ან იპოვის ახალ ოჯახს, გთხოვთ დაუყოვნებლივ შეხვიდეთ{" "}
                <Link href="/chemi-gancxadebebi" className="text-[var(--moss)] underline font-semibold">
                  პირად კაბინეტში
                </Link>{" "}
                და დააჭიროთ ღილაკს <strong>„🎉 ვიპოვეთ!“</strong> ან <strong>„🏡 გაჩუქდა!“</strong>.
              </p>
              <p className="text-xs text-[var(--ink-soft)]">
                ეს რუკას გაათავისუფლებს უკვე მოგვარებული ამბებისგან და თქვენს ისტორიას გადაიტანს „ბედნიერ ისტორიებში“, რაც სხვებს იმედს მისცემს!
              </p>
            </section>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
