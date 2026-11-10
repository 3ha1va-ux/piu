"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserAuth } from "@/lib/userAuthContext";

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, openAuthModal, logout } = useUserAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { name: "რუკა", href: "/" },
    { name: "ძებნა", href: "/dzieba" },
    { name: "ისტორიები", href: "/istoriebi" },
    { name: "რჩევები", href: "/rchevebi" },
    { name: "წესები", href: "/wesebi" },
  ];

  return (
    <header className="relative z-30 w-full border-b border-[var(--mist)]/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 md:py-4">
        {/* Brand */}
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ink)] md:text-2xl hover:opacity-90 transition"
        >
          piu.ge
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition ${
                  isActive
                    ? "text-[var(--moss)] font-semibold"
                    : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Add Listing Button */}
          <Link
            href="/gancxadeba"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[var(--moss)] px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[var(--leaf)]"
          >
            <span>+</span>
            <span>განცხადების დამატება</span>
          </Link>

          {/* User Auth Button */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-[var(--mist)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--paper)] transition"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--moss)] text-white flex items-center justify-center font-bold text-xs uppercase">
                  {user.name ? user.name[0] : user.email[0]}
                </div>
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.name || user.email.split("@")[0]}
                </span>
                <svg className="w-3.5 h-3.5 text-[var(--ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-[var(--mist)] text-sm animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-[var(--mist)]/60 text-xs">
                    <p className="font-semibold text-[var(--ink)] truncate">{user.name || "მომხმარებელი"}</p>
                    <p className="text-[var(--ink-soft)] truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--paper)] text-[var(--ink)] transition text-xs font-medium"
                    >
                      <svg className="w-4 h-4 text-[var(--moss)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>პროფილი / ჩემი განცხადებები</span>
                    </Link>

                    <div className="border-t border-[var(--mist)]/60 my-1"></div>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 transition text-xs font-medium text-left"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>გასვლა</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--mist)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-xs transition hover:bg-[var(--paper)]"
            >
              <svg className="w-4 h-4 text-[var(--ink-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>შესვლა</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--ink)] hover:bg-[var(--paper)] transition active:scale-95 touch-manipulation"
            aria-label="მენიუ"
            aria-expanded={mobileMenuOpen}
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
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--mist)]/70 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2 text-sm shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-50 text-[var(--moss)] font-semibold"
                    : "text-[var(--ink)] hover:bg-[var(--paper)]"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="border-t border-[var(--mist)]/60 pt-2 space-y-1">
            <Link
              href="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2 text-xs text-[var(--ink-soft)] hover:text-[var(--ink)] font-medium rounded-lg hover:bg-[var(--paper)]"
            >
              🔒 კონფიდენციალურობა
            </Link>
          </div>
          <div className="pt-1">
            <Link
              href="/gancxadeba"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-[var(--moss)] hover:bg-[var(--leaf)] text-white font-semibold text-sm shadow-sm transition active:scale-[0.99] touch-manipulation"
            >
              <span>+</span>
              <span>განცხადების დამატება</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
