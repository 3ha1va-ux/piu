"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ავტორიზაციის შეცდომა");
        setIsLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("კავშირის შეცდომა სერვერთან");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[var(--paper)] text-[var(--ink)]">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-[var(--moss)] hover:opacity-80 transition"
          >
            <span>piu.ge</span>
            <span className="text-xs bg-[var(--mist)] text-[var(--moss)] px-2 py-0.5 rounded-full font-sans font-medium">
              ადმინი
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--ink)]">
            სისტემაში შესვლა
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            შეიყვანეთ ადმინისტრატორის მონაცემები
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-[var(--mist)]/60 p-6 sm:p-8">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                მომხმარებლის სახელი
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 outline-none transition bg-white text-[var(--ink)]"
                placeholder="admin"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--ink)] mb-1.5"
              >
                პაროლი
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--mist)] focus:border-[var(--moss)] focus:ring-2 focus:ring-[var(--moss)]/20 outline-none transition bg-white text-[var(--ink)]"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white font-medium transition shadow-md shadow-[var(--moss)]/15 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>შესვლა...</span>
                </>
              ) : (
                "სისტემაში შესვლა"
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--ink-soft)] hover:text-[var(--moss)] transition inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>მთავარ გვერდზე დაბრუნება</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
