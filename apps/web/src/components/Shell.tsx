"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const shellLinks = [
  { href: "/search", label: "Search exams" },
  { href: "/exams", label: "All exams" },
  { href: "/fields", label: "Fields" },
  { href: "/account", label: "Account" },
] as const;

function LogoMark() {
  return (
    <img
      src="/merrakii-logo.png"
      alt="MERRAKii"
      className="h-9 w-auto shrink-0 object-contain"
      aria-hidden
    />
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <header className="dam-shell-header sticky top-0 z-40 border-b border-[var(--m-border)] bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl min-w-0 flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link href="/" className="group flex min-w-0 max-w-[min(100%,14rem)] shrink items-center gap-2 sm:max-w-none sm:gap-3">
            <LogoMark />
            <div className="min-w-0 leading-tight">
              <span className="block truncate text-xs font-bold tracking-tight text-[var(--m-navy)] transition group-hover:text-[var(--m-burgundy)] sm:text-sm">
                Digital Academic Marketplace
              </span>
              <span className="hidden text-[11px] font-medium text-[var(--muted)] lg:block">
                Exams · Institutes · Applications
              </span>
            </div>
          </Link>
          <nav
            className="dam-shell-desktop-nav hidden min-w-0 flex-wrap items-center justify-end gap-0.5 lg:flex xl:gap-2"
            aria-label="App"
          >
            {shellLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-2 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--m-cream)] hover:text-[var(--m-navy)] xl:px-3 xl:text-sm"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/india#login"
              className="ml-0.5 rounded-lg bg-gradient-to-r from-[#b01f24] to-[#8b1a2a] px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105 xl:ml-1 xl:px-3 xl:text-sm"
            >
              Sign in
            </Link>
          </nav>
          <div className="dam-shell-mobile flex items-center gap-2 lg:hidden">
            <Link
              href="/india#login"
              className="rounded-lg bg-gradient-to-r from-[#b01f24] to-[#8b1a2a] px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:brightness-105"
            >
              Sign in
            </Link>
            <button
              type="button"
              className="shell-mobile-nav-btn rounded-lg border border-[var(--m-border)] bg-white px-3 py-2 text-xs font-bold uppercase tracking-wide text-[var(--m-ink)] shadow-sm"
              aria-expanded={mobileNavOpen}
              aria-controls="dam-shell-drawer"
              onClick={() => setMobileNavOpen(true)}
            >
              Menu
            </button>
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="dam-shell-mobile fixed inset-0 z-[60] bg-black/45 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            id="dam-shell-drawer"
            className="dam-shell-mobile fixed inset-y-0 right-0 z-[70] flex w-[min(20rem,calc(100%-1rem))] max-w-[min(20rem,100%-1rem)] flex-col border-l border-[var(--m-border)] bg-white pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="App menu"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--m-border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--m-navy)]">Menu</span>
              <button
                type="button"
                className="rounded-md p-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--m-cream)]"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto overscroll-contain p-2" aria-label="App mobile">
              {shellLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-md px-4 py-3 text-base font-medium text-[var(--muted)] no-underline hover:bg-[var(--m-cream)] hover:text-[var(--m-navy)]"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      ) : null}

      <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-3 py-6 sm:px-4 sm:py-8">{children}</main>
      <footer className="mt-auto border-t border-[var(--m-navy-deep)] bg-gradient-to-b from-[#0c226b] to-[#071a47] py-10 text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 sm:flex-row sm:items-start sm:justify-between sm:px-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#e39632]">Marketplace</p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
              © {new Date().getFullYear()} Digital Academic Marketplace. Guidance for India&apos;s competitive exam and
              institute journey.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-white/80">
            <span className="inline-flex w-fit rounded-md border border-white/20 bg-white/5 px-2 py-1 text-xs font-medium text-[#f0d9a8]">
              English (India)
            </span>
            <span className="text-xs text-white/55">Secure payments · Razorpay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
