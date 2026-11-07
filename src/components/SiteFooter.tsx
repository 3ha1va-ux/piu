import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--mist)]/80 bg-white py-8 text-xs text-[var(--ink-soft)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-[var(--mist)]/60">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)] hover:text-[var(--moss)] transition"
            >
              piu.ge
            </Link>
            <span className="text-[11px] text-[var(--ink-soft)]">
              — დაკარგული და ნაპოვნი ცხოველების პლატფორმა
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <Link href="/rchevebi" className="hover:text-[var(--moss)] transition">
              💡 რჩევები
            </Link>
            <Link href="/istoriebi" className="hover:text-[var(--moss)] transition">
              📖 ისტორიები
            </Link>
            <Link href="/wesebi" className="hover:text-[var(--moss)] transition">
              🛡️ საიტის წესები
            </Link>
            <Link href="/privacy" className="hover:text-[var(--moss)] transition">
              🔒 კონფიდენციალურობა
            </Link>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-center sm:text-left">
          <p>© {new Date().getFullYear()} piu.ge — ყველა უფლება დაცულია.</p>
          <p>
            კონტაქტი & მხარდაჭერა:{" "}
            <a
              href="mailto:support@piu.ge"
              className="font-semibold text-[var(--moss)] hover:underline"
            >
              support@piu.ge
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
