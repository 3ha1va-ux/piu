"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    {
      name: "დეშბორდი",
      href: "/admin",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      name: "განცხადებები",
      href: "/admin/listings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
    },
    {
      name: "ანალიტიკა",
      href: "/admin/analytics",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-[var(--mist)] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/admin" className="font-display font-bold text-lg text-[var(--moss)] flex items-center gap-1.5">
          <span>piu.ge</span>
          <span className="text-[10px] bg-[var(--mist)] text-[var(--moss)] px-1.5 py-0.5 rounded font-sans">
            ადმინი
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[var(--ink)] hover:bg-[var(--mist)]/40 transition"
            aria-label="მენიუს გახსნა"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-[var(--mist)] flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            {/* Logo */}
            <div className="pb-6 mb-6 border-b border-[var(--mist)]/60 flex items-center justify-between">
              <Link href="/admin" className="font-display text-xl font-bold text-[var(--moss)] flex items-center gap-2">
                <span>piu.ge</span>
                <span className="text-[11px] bg-[var(--moss)] text-white px-2 py-0.5 rounded-full font-sans font-medium">
                  ადმინი
                </span>
              </Link>
              {/* Close button for mobile */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden p-1 text-[var(--ink-soft)] hover:text-[var(--ink)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition ${
                      isActive
                        ? "bg-[var(--moss)] text-white shadow-sm"
                        : "text-[var(--ink-soft)] hover:bg-[var(--mist)]/40 hover:text-[var(--ink)]"
                    }`}
                  >
                    <span className={isActive ? "text-white" : "text-[var(--ink-soft)]"}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="pt-6 border-t border-[var(--mist)]/60 space-y-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--mist)]/40 hover:text-[var(--ink)] transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span>საიტზე გადასვლა</span>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition text-left disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>{isLoggingOut ? "გასვლა..." : "სისტემიდან გასვლა"}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
