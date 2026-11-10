"use client";

import { useState, useEffect } from "react";
import { useUserAuth } from "@/lib/userAuthContext";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    sendEmailOtp,
    verifyEmailOtp,
    loginWithGoogle,
  } = useUserAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Reset state whenever modal is opened / closed
  useEffect(() => {
    if (!isAuthModalOpen) {
      setStep("email");
      setEmail("");
      setOtpCode("");
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isAuthModalOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Resend cooldown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (!isAuthModalOpen) return null;

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await loginWithGoogle();
    setIsSubmitting(false);
    if (!res.ok && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("გთხოვთ მიუთითოთ სწორი ელფოსტის მისამართი.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = await sendEmailOtp(cleanEmail);
    setIsSubmitting(false);

    if (res.ok) {
      setStep("otp");
      setCountdown(60);
      setSuccessMessage(`შესვლის ბმული / კოდი გაიგზავნა: ${cleanEmail}`);
    } else {
      setErrorMessage(res.error || "მეილის გაგზავნა ვერ მოხერხდა. სცადეთ მოგვიანებით.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMessage("გთხოვთ შეიყვანოთ 6-ნიშნა კოდი.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await verifyEmailOtp(email, cleanCode);
    setIsSubmitting(false);

    if (res.ok) {
      setSuccessMessage("ავტორიზაცია წარმატებით დასრულდა!");
    } else {
      setErrorMessage(res.error || "კოდი არასწორია ან ვადა გაუვიდა.");
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    const res = await sendEmailOtp(email.trim());
    setIsSubmitting(false);

    if (res.ok) {
      setCountdown(60);
      setSuccessMessage("ახალი ბმული / კოდი გაიგზავნა თქვენს ელფოსტაზე.");
    } else {
      setErrorMessage(res.error || "ხელახლა გაგზავნა ვერ მოხერხდა.");
    }
  };

  return (
    <div
      onClick={closeAuthModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--mist)] text-[var(--ink)] my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - 44px touch target */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-[var(--ink-soft)] hover:text-[var(--ink)] hover:bg-[var(--paper)] transition active:scale-95 touch-manipulation"
          aria-label="დახურვა"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-1 sm:pt-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--paper)] text-[var(--moss)] mb-3 shadow-xs">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 id="auth-modal-title" className="text-2xl font-bold font-display text-[var(--ink)] tracking-tight">
            {step === "email" ? "შესვლა piu.ge-ზე" : "ერთჯერადი კოდი"}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--ink-soft)] mt-1.5 leading-relaxed">
            {step === "email"
              ? "აირჩიეთ სასურველი მეთოდი სწრაფი და უსაფრთხო ავტორიზაციისთვის"
              : `გამოგზავნილია მეილზე: ${email}. შეგიძლიათ პირდაპირ დააჭიროთ მეილის ბმულს ან ჩაწეროთ 6-ნიშნა კოდი.`}
          </p>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm leading-relaxed flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success message */}
        {successMessage && !errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm leading-relaxed flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: Google 1-Click + Email */}
        {step === "email" && (
          <div className="space-y-4">
            {/* Primary Google 1-Click Login */}
            <button
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              type="button"
              className="w-full flex items-center justify-center gap-3 h-12 px-4 rounded-xl border-2 border-[var(--mist)] hover:border-[var(--moss)]/40 hover:bg-[var(--paper)] font-semibold text-sm sm:text-base transition shadow-xs active:scale-[0.99] touch-manipulation disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>Google-ით შესვლა (1-Click)</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[var(--mist)]"></div>
              <span className="flex-shrink mx-3 text-xs text-[var(--ink-soft)] font-medium">ან ელფოსტის ბმულით</span>
              <div className="flex-grow border-t border-[var(--mist)]"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSendEmail} className="space-y-3.5">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-[var(--ink)] mb-1.5">
                  თქვენი ელფოსტა
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="saxeli@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 text-base sm:text-sm rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 outline-none transition bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full h-12 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-sm sm:text-base font-semibold transition shadow-md shadow-[var(--moss)]/15 active:scale-[0.99] touch-manipulation disabled:opacity-50"
              >
                {isSubmitting ? "იგზავნება..." : "შესვლის ბმულის მიღება"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[var(--paper)] text-xs text-[var(--ink-soft)] leading-relaxed text-center">
              💡 შეამოწმეთ თქვენი ელფოსტა: შეგიძლიათ <strong>პირდაპირ დააჭიროთ მეილში მოსულ ბმულს</strong> და საიტი წამში გაიხსნება, ან შეიყვანოთ კოდი:
            </div>

            <div>
              <label htmlFor="auth-otp" className="block text-xs font-semibold text-[var(--ink)] mb-1.5 text-center">
                6-ნიშნა კოდი
              </label>
              <input
                id="auth-otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, ""))}
                className="w-full tracking-[0.35em] text-center font-mono text-2xl font-bold h-14 px-4 rounded-xl border-2 border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/30 outline-none transition bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || otpCode.trim().length < 6}
              className="w-full h-12 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white text-sm sm:text-base font-semibold transition shadow-md shadow-[var(--moss)]/15 active:scale-[0.99] touch-manipulation disabled:opacity-50"
            >
              {isSubmitting ? "მოწმდება..." : "კოდით დადასტურება"}
            </button>

            {/* Actions: Resend or Change Email */}
            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setErrorMessage(null);
                }}
                className="text-[var(--ink-soft)] hover:text-[var(--ink)] underline transition"
              >
                ← მეილის შეცვლა
              </button>

              <button
                type="button"
                disabled={countdown > 0 || isSubmitting}
                onClick={handleResend}
                className="text-[var(--moss)] hover:underline disabled:text-[var(--ink-soft)] disabled:no-underline transition font-semibold"
              >
                {countdown > 0 ? `ხელახლა გაგზავნა (${countdown}წმ)` : "ხელახლა გაგზავნა"}
              </button>
            </div>
          </form>
        )}

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
