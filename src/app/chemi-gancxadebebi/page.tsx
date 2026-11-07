"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DeprecatedMyListingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="text-center p-8">
        <div className="w-8 h-8 border-2 border-[var(--moss)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-[var(--ink-soft)]">
          გადამისამართება პროფილის გვერდზე...
        </p>
      </div>
    </div>
  );
}
