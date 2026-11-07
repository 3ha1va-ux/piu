import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "კონფიდენციალურობის პოლიტიკა — piu.ge",
  description:
    "piu.ge-ს პერსონალურ მონაცემთა დაცვისა და კონფიდენციალურობის პოლიტიკა. შეიტყვეთ, როგორ ვიცავთ თქვენს მონაცემებს.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-12">
          {/* Header */}
          <div className="border-b border-[var(--mist)] pb-6 mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--moss)]">
              ოფიციალური დოკუმენტი
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-display text-[var(--ink)] mt-1.5">
              კონფიდენციალურობის პოლიტიკა
            </h1>
            <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-2">
              ბოლო განახლება: 2026 წლის ნოემბერი • შეესაბამება საქართველოს კანონს „პერსონალურ მონაცემთა დაცვის შესახებ“
            </p>
          </div>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[var(--ink)]">
            {/* Section 1 */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>🛡️</span>
                <span>1. მთავარი პრინციპი და გარანტია</span>
              </h2>
              <p className="text-[var(--ink-soft)]">
                პლატფორმა <strong>piu.ge</strong> შექმნილია დაკარგული, ნაპოვნი და გასაჩუქებელი ცხოველების პატრონებთან დასაბრუნებლად. ჩვენ პატივს ვცემთ თქვენს პირად სივრცეს და ვაგროვებთ მხოლოდ იმ მინიმალურ ინფორმაციას, რაც კრიტიკულად აუცილებელია პლატფორმის გამართული ფუნქციონირებისა და ცხოველის სწრაფი პოვნისა და უსაფრთხოებისთვის.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900 font-medium">
                🔒 <strong>მთავარი გარანტია:</strong> თქვენი პირადი ელფოსტის მისამართი საიტზე <strong>არასდროს ჩანს საჯაროდ</strong> და არასდროს გადაეცემა მესამე პირებს სარეკლამო მიზნებისთვის.
              </div>
            </section>

            {/* Section 2 */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>📋</span>
                <span>2. რა მონაცემებს ვაგროვებთ</span>
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-[var(--ink-soft)]">
                <li>
                  <strong className="text-[var(--ink)]">ავტორიზაციის მონაცემები:</strong> ელფოსტის მისამართი (Google Sign-In ან Email OTP ბმული) მომხმარებლის იდენტიფიცირებისთვის, საკუთარი განცხადებების სამართავად და სპამის პრევენციისთვის.
                </li>
                <li>
                  <strong className="text-[var(--ink)]">განცხადების საკონტაქტო ინფორმაცია:</strong> საკონტაქტო სახელი, ტელეფონის ნომერი და რუკის ლოკაცია, რომელსაც თავად უთითებთ განცხადების შევსებისას. ეს მონაცემები საჯარო ხდება, რათა მპოვნელმა ან მაძიებელმა შეძლოს თქვენთან დაკავშირება.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>🗑️</span>
                <span>3. მონაცემთა წაშლისა და რედაქტირების უფლება</span>
              </h2>
              <p className="text-[var(--ink-soft)]">
                თქვენ გაქვთ სრული კონტროლი თქვენს მიერ გამოქვეყნებულ ინფორმაციაზე. ნებისმიერ დროს შეგიძლიათ შეხვიდეთ პირად პროფილში (<strong>/profile</strong>) და:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--ink-soft)]">
                <li>შეცვალოთ განცხადების სტატუსი („ნაპოვნია“, „გაჩუქდა“), რის შემდეგაც ის გაქრება აქტიური რუკიდან;</li>
                <li>დამალოთ ან წაშალოთ საკონტაქტო ინფორმაცია;</li>
                <li>სამუდამოდ წაშალოთ განცხადება და მასთან დაკავშირებული ფოტოები ჩვენი სერვერებიდან.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>🍪</span>
                <span>4. ქუქი-ფაილები (Cookies) და უსაფრთხოება</span>
              </h2>
              <p className="text-[var(--ink-soft)]">
                piu.ge იყენებს მხოლოდ აუცილებელ ტექნიკურ ქუქი-ფაილებს მომხმარებლის ავტორიზაციის სესიის შესანარჩუნებლად. ჩვენ არ ვიყენებთ თვალთვალის სარეკლამო ქსელებს (Cross-site tracking).
              </p>
            </section>

            {/* Section 5 */}
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-[var(--mist)]/70 shadow-xs space-y-3">
              <h2 className="text-lg sm:text-xl font-bold font-display text-[var(--ink)] flex items-center gap-2">
                <span>✉️</span>
                <span>5. კავშირი ადმინისტრაციასთან</span>
              </h2>
              <p className="text-[var(--ink-soft)]">
                თუ გაქვთ რაიმე კითხვა პერსონალურ მონაცემებთან დაკავშირებით ან გსურთ თქვენი პროფილის სრული დეაქტივაცია, მოგვწერეთ ელფოსტაზე: <strong>support@piu.ge</strong> ან დაგვიკავშირდით პლატფორმის მეშვეობით.
              </p>
            </section>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
