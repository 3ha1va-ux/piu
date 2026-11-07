import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "რჩევები და გზამკვლევი — piu.ge",
  description:
    "რა უნდა გააკეთოთ თუ ცხოველი დაგეკარგათ ან იპოვეთ? ნაბიჯ-ნაბიჯ გზამკვლევი, თავშესაფრების კონტაქტები და ცხელი ხაზები.",
};

export default function TipsPage() {
  const emergencyContacts = [
    {
      title: "თბილისის ცხოველთა მონიტორინგის სააგენტო (მუნიციპალური თავშესაფარი)",
      phone: "032 2 421 424",
      desc: "თბილისის მერიის ოფიციალური სააგენტო. რეკავთ თუ ცხოველი დაიკარგა ან იპოვეთ დაშავებული.",
      badge: "ოფიციალური",
    },
    {
      title: "საგანგებო სიტუაციების მართვის სამსახური (112)",
      phone: "112",
      desc: "გადაუდებელი შემთხვევებისთვის, როდესაც ცხოველი ჩავარდნილია ჭაში, ხეზეა ან საფრთხეშია.",
      badge: "24/7",
    },
    {
      title: "ვეტერინარული კლინიკები (ჩიპის სკანირება)",
      phone: "ნებისმიერი უახლოესი ვეტ-კლინიკა",
      desc: "ჩიპის არსებობის შემოწმება და სკანირება საქართველოში ყველა ვეტერინარულ კლინიკაში უფასოა!",
      badge: "უფასო",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-12">
          {/* Header */}
          <div className="border-b border-[var(--mist)] pb-6 mb-8 text-center sm:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--moss)]">
              სამაშველო გზამკვლევი
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--ink)] mt-1.5">
              რჩევები: რა ვქნათ დაკარგვისას?
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-2">
              ნაბიჯ-ნაბიჯ მოქმედების გეგმა, რომელიც ცხოველის პოვნის შანსს 80%-ით ზრდის.
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
            {/* Guide A: If Pet is Lost */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                <span>🚨</span>
                <span>თუ ცხოველი დაგეკარგათ</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
                პირველი 24 საათის ოქროს წესები:
              </h2>

              <div className="space-y-4 pt-2">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[var(--moss)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      განათავსეთ განცხადება piu.ge-ზე დაუყოვნებლივ
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                      მონიშნეთ ზუსტი წერტილი რუკაზე, ატვირთეთ მკაფიო ფოტო და მიუთითეთ ტელეფონის ნომერი. ეს წამებში გახდება ხილვადი თქვენს უბანში.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[var(--moss)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      ამობეჭდეთ A4 სამძებრო პოსტერი (1 კლიკით საიტიდან)
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                      თქვენს განცხადებაში დააჭირეთ ღილაკს <strong>„🖹 პოსტერი“</strong>. სისტემა თავად დააგენერირებს მზა A4 ფლაერს QR კოდით. გააკარით დაკარგვის ადგილის 500 მეტრის რადიუსში: მაღაზიებთან, გაჩერებებთან, სადარბაზოებში.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[var(--moss)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      გააფრთხილეთ უბნის „თვალები“
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                      დაელაპარაკეთ ეზოს დამლაგებლებს, კონსიერჟებს, ტაქსისტებს და სხვა ძაღლების პატრონებს. ისინი ყველაზე ხშირად ამჩნევენ უცხო ცხოველს.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[var(--moss)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      დარეკეთ მუნიციპალურ თავშესაფარში
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                      დარეკეთ ნომერზე <strong>032 2 421 424</strong> და იკითხეთ, ხომ არ შემოუყვანიათ მსგავსი ცხოველი ბოლო საათებში თქვენი უბნიდან.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[var(--moss)] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      ღამის მშვიდი ძებნა (03:00 – 05:00 საათებში)
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-0.5">
                      ძაღლის ან განსაკუთრებით შეშინებული კატის ძებნა ყველაზე შედეგიანია ღრმა ღამით, 03:00-დან 05:00 საათამდე. ამ დროს ქალაქში ქრება მანქანების გრუხუნი და ხმაური, ირგვლივ სრული სიჩუმეა. ცხოველს ბევრად შორიდან ესმის თქვენი ნაცნობი ხმა, ხოლო თქვენ შეძლებთ გაიგონოთ მისი ჩუმი წკმუტუნი, კნავილი ან მოძრაობა სამალავიდან (მანქანის ქვემოდან, სარდაფის ჭუჭრუტანიდან). იარეთ ნელა, პერიოდულად შეჩერდით და მშვიდი ხმით დაუძახეთ სახელი.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Guide B: If You Found a Pet */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <span>🐾</span>
                <span>თუ ქუჩაში იპოვეთ დაკარგული ცხოველი</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-[var(--ink)]">
                როგორ მოვიქცეთ სწორად:
              </h2>

              <ul className="list-disc pl-5 space-y-2 text-[var(--ink-soft)]">
                <li>
                  <strong className="text-[var(--ink)]">შეამოწმეთ piu.ge-ს რუკა იმავე ლოკაციაზე:</strong> სანამ ახალ განცხადებას დაამატებთ, პირველ რიგში გახსენით piu.ge და შეამოწმეთ რუკა იმ კონკრეტულ უბანში/ქუჩაზე, სადაც ცხოველი შენიშნეთ. დიდი ალბათობით, შეშფოთებულ პატრონს უკვე რამდენიმე საათია განთავსებული აქვს „დაკარგულია“ განცხადება და პირდაპირ დაუკავშირდებით მითითებულ ნომერზე!
                </li>
                <li>
                  <strong className="text-[var(--ink)]">დაასკანერეთ ჩიპი:</strong> მიიყვანეთ ცხოველი ნებისმიერ უახლოეს ვეტერინარულ კლინიკაში. ჩიპის წამკითხველის შემოწმება უფასოა და წამებში გაიგებთ პატრონის ტელეფონს.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">შეამოწმეთ ყელსაბამი:</strong> ხშირად ყელსაბამის შიდა მხარეს ან მედალიონზე წერია ტელეფონის ნომერი.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">დაამატეთ „ნაპოვნია“ განცხადება:</strong> გადაუღეთ ფოტო და განათავსეთ piu.ge-ზე. პატრონი დიდი ალბათობით სწორედ რუკაზე ეძებს თავის ოთხფეხა მეგობარს.
                </li>
              </ul>
            </section>

            {/* Emergency Hotlines Box */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>📞</span>
                <span>ცხელი ხაზები და გადაუდებელი კონტაქტები</span>
              </h2>

              <div className="grid grid-cols-1 gap-3 pt-1">
                {emergencyContacts.map((c) => (
                  <div
                    key={c.title}
                    className="p-4 rounded-2xl bg-[var(--paper)] border border-[var(--mist)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[var(--ink)]">{c.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {c.badge}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ink-soft)] mt-1">{c.desc}</p>
                    </div>

                    <a
                      href={`tel:${c.phone.replace(/\s+/g, "")}`}
                      className="px-4 py-2 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-xs font-semibold shrink-0 transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>📞</span>
                      <span>{c.phone}</span>
                    </a>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="text-center p-8 bg-white rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h3 className="font-display font-bold text-xl text-[var(--ink)]">
                დაიკარგა ან იპოვეთ ცხოველი?
              </h3>
              <p className="text-xs sm:text-sm text-[var(--ink-soft)] max-w-md mx-auto">
                არ დაკარგოთ დრო — განათავსეთ განცხადება რუკაზე ახლავე.
              </p>
              <Link
                href="/gancxadeba"
                className="inline-flex py-3 px-6 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-sm font-semibold transition shadow-md shadow-[var(--moss)]/15"
              >
                + განცხადების დამატება
              </Link>
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
