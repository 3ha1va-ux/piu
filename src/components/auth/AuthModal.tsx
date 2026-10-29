"use client";

import { useState } from "react";
import { useUserAuth } from "@/lib/userAuthContext";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, loginWithEmail } = useUserAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setIsSubmitting(true);
    try {
      await loginWithEmail(email.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--mist)] text-[var(--ink)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--ink-soft)] hover:bg-[var(--paper)] transition"
          aria-label="დახურვა"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--moss)] mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold font-display text-[var(--ink)] tracking-tight">
            შესვლა piu.ge-ზე
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">
            განცხადების სამართავად და სპამისგან თავის დასაცავად გთხოვთ გაიაროთ ავტორიზაცია
          </p>
        </div>

        {/* Google 1-Click Login */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleClick}
            disabled={isSubmitting}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[var(--mist)] hover:bg-[var(--paper)] font-medium text-sm transition shadow-xs disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google-ით შესვლა</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[var(--mist)]"></div>
            <span className="flex-shrink mx-3 text-xs text-[var(--ink-soft)] font-medium">ან ელფოსტით</span>
            <div className="flex-grow border-t border-[var(--mist)]"></div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[var(--ink-soft)] mb-1">
                თქვენი ელფოსტა
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="saxeli@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] outline-none transition bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? "შესვლა..." : "გაგრძელება ელფოსტით"}
            </button>
          </form>
        </div>

        {/* Security / Anti-Spam Badge */}
        <div className="mt-6 pt-4 border-t border-[var(--mist)]/60 text-center">
          <p className="text-[11px] text-[var(--ink-soft)] flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
            </svg>
            <span>უსაფრთხო ავტორიზაცია • სპამისგან დაცული პლატფორმა</span>
          </p>
        </div>
      </div>
    </div>
  );
}
