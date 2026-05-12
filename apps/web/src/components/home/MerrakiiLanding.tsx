"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

const STUDY_ABROAD_SITE = "https://merrakii.co.in/";

const FIGMA_NAV: [string, string][] = [
  ["Home", "/#top"],
  ["About Us", "/#about"],
  ["Our Services", "/#what-we-do"],
  ["Resources", "/catalog"],
  ["Contact Us", "/#contact"],
];

/** Reference UI: flags USA → NZ, exams JEE → UPSC (design row order) */
const HERO_DEST_EXAMS = [
  { flag: "🇺🇸", label: "USA", exam: "JEE" },
  { flag: "🇨🇦", label: "Canada", exam: "NEET" },
  { flag: "🇦🇺", label: "Australia", exam: "CLAT" },
  { flag: "🇦🇪", label: "UAE", exam: "SAT" },
  { flag: "🇪🇺", label: "European Union", exam: "CUET" },
  { flag: "🇳🇿", label: "New Zealand", exam: "UPSC" },
] as const;

/** Scrolling row (mobile / secondary) */
const COURSE_TICKER = ["JEE", "NEET", "CLAT", "SAT", "CUET", "UPSC"] as const;
const COUNTRY_TICKER = [
  "USA",
  "Canada",
  "Australia",
  "UAE",
  "European Union",
  "New Zealand",
  "USA",
  "Canada",
  "Australia",
  "UAE",
  "European Union",
] as const;

const SERVICE_CARDS = [
  "Global University Access",
  "Expert Study Abroad Counselors",
  "India’s Highest Acceptance Rates",
  "Seamless and \nTransparent Process",
] as const;

const ABOUT_COPY =
  "Merrakii, the flagship brand of Munjal Universal Consultancy, is transforming international education by connecting students, universities, and the global community on a unified platform. As India's pioneering academic services hub, Merrakii empowers students with access to world-class opportunities, fostering leadership and nurturing global citizens.\n\nWith a commitment to personalized guidance, we aim to revolutionize the education landscape and unlock the potential of India's youth on the global stage.\n\nWith a commitment to personalized guidance, we aim to revolutionize the education landscape and unlock the potential of India's youth on the global stage.";

const WHAT_WE_DO_COPY =
  "At MERRAKii, we provide a comprehensive range of services designed to support every step of the student journey. From personalised academic counselling and strategic career planning to bespoke worldwide university admissions guidance, we take pride in being the best counsellor for study abroad, crafting tailored overseas education solutions that drive students toward their academic and professional goals. Our thoughtfully designed study abroad programs offer unmatched access to top-tier educational institutions globally. With the right tools and resources, every student can excel in today’s competitive academic landscape. We are dedicated to delivering excellence at every stage, empowering students to unlock their full potential and emerge as future leaders.";

function cn(...xs: (string | false | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m2.2-5.8a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function HeadphonesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 14v5a2 2 0 002 2h1v-9H6a2 2 0 00-2 2zm16 0v5a2 2 0 01-2 2h-1v-9h1a2 2 0 012 2z"
        stroke="#101828"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M4 14v-3a8 8 0 0116 0v3"
        stroke="#101828"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconLaptop({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="5" y="7" width="22" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 25h26v1.5H3V25z" fill="currentColor" />
      <path d="M12 25h8l-1 3h-6l-1-3z" fill="currentColor" />
    </svg>
  );
}

function IconProgressRing({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <circle
        cx="16"
        cy="16"
        r="12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="56 88"
        transform="rotate(-90 16 16)"
      />
    </svg>
  );
}

function IconTutorBoard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="6" y="8" width="20" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 12h7M10 15h12M10 18h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="23" cy="22" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.3" />
      <path d="M21 26c1.2 1 3.8 1 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function MerrakiiLanding() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

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

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.querySelectorAll(".mk-home-reveal").forEach((el) => el.classList.add("mk-home-reveal--visible"));
      return;
    }
    const els = root.querySelectorAll(".mk-home-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) e.target.classList.add("mk-home-reveal--visible");
        }
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = searchQ.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
    else router.push("/search");
  }

  const courseLoop = [...COURSE_TICKER, ...COURSE_TICKER];
  const countryLoop = [...COUNTRY_TICKER, ...COUNTRY_TICKER];

  return (
    <div ref={rootRef} className="mk-home min-h-screen max-w-full min-w-0 overflow-x-hidden bg-[#FFFDF5]">
      <a
        href="#mk-main"
        className="mk-home-skip focus:outline-none fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-[#B92E2E] px-4 py-2 text-sm font-semibold text-white opacity-0 transition focus:translate-y-0 focus:opacity-100"
      >
        Skip to content
      </a>

      <div id="top" className="relative overflow-hidden">
        <div className="relative min-h-[min(100vh,960px)] pb-12 pt-2 md:pb-20">
          <div
            className="pointer-events-none absolute left-[4%] top-[14%] hidden h-[min(52vw,340px)] w-[min(52vw,340px)] opacity-[0.35] sm:block lg:left-[6%]"
            aria-hidden
          >
            <div className="absolute inset-[4%] rounded-full border border-[#B92E2E]/18" />
            <div className="absolute inset-[14%] rounded-full border border-[#B92E2E]/12" />
            <div className="absolute inset-[24%] rounded-full border border-[#1D3557]/08" />
            <span className="absolute left-[8%] top-[28%] h-2 w-2 rounded-full bg-[#B92E2E]" />
            <span className="absolute right-[22%] top-[14%] h-1.5 w-1.5 rounded-full bg-[#B92E2E]" />
          </div>

          <div
            className="pointer-events-none absolute left-[42%] top-12 h-[min(92vw,620px)] w-[min(92vw,620px)] -translate-x-1/2 opacity-40 md:left-[56%] md:top-20 lg:left-[52%] lg:opacity-[0.38]"
            aria-hidden
          >
            <div className="absolute inset-[6%] rounded-full border border-[#B92E2E]/22" />
            <div className="absolute inset-[16%] rounded-full border border-[#B92E2E]/16" />
            <div className="absolute inset-[26%] rounded-full border border-[#1D3557]/10" />
            <span className="absolute left-[10%] top-[18%] h-2 w-2 rounded-full bg-[#B92E2E]" />
            <span className="absolute right-[16%] top-[28%] h-1.5 w-1.5 rounded-full bg-[#B92E2E]" />
            <span className="absolute bottom-[22%] left-[20%] h-1.5 w-1.5 rounded-full bg-[#B92E2E]" />
            <span className="absolute bottom-[16%] right-[12%] h-2 w-2 rounded-full bg-[#B92E2E]" />
          </div>

          <header className="relative z-20 mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Link href="/" className="shrink-0 no-underline" aria-label="Merrakii home">
                  <img
                    src="/merrakii-logo.png"
                    alt="MERRAKii"
                    className="h-14 w-auto object-contain sm:h-[4.75rem]"
                  />
                </Link>
                <button
                  type="button"
                  className="ml-auto rounded-lg border border-[#1D3557]/18 bg-white px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#1D3557]/70 sm:hidden"
                  aria-expanded={mobileNavOpen}
                  aria-controls="mk-figma-drawer"
                  onClick={() => setMobileNavOpen(true)}
                >
                  Menu
                </button>
              </div>

              <a
                href="tel:+919899088710"
                className="hidden items-center gap-3 rounded-2xl border-[3px] border-[#B92E2E] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(29,53,87,0.08)] no-underline sm:flex"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFFDF5]">
                  <HeadphonesIcon className="h-7 w-7" />
                </span>
                <span className="text-left">
                  <span className="block font-[family-name:var(--font-mk-inter),sans-serif] text-base font-bold text-[#101828]">
                    Talk to an Expert
                  </span>
                  <span className="block font-[family-name:var(--font-mk-inter),sans-serif] text-sm font-semibold text-[#706767]">
                    +91 98990 88710
                  </span>
                </span>
              </a>
            </div>

            <nav
              className="mx-auto mt-5 hidden w-full max-w-5xl rounded-full bg-[#B92E2E] px-2 py-2 shadow-[0_8px_24px_rgba(185,46,46,0.28)] sm:block sm:py-2.5"
              aria-label="Primary"
            >
              <div className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1">
                {FIGMA_NAV.map(([label, href], i) => {
                  const isHome = i === 0;
                  return (
                    <a
                      key={label}
                      href={href}
                      className={cn(
                        "inline-flex min-w-0 justify-center rounded-full px-3 py-2 font-[family-name:var(--font-mk-inter),sans-serif] text-sm text-white no-underline transition hover:bg-white/15 sm:min-w-[6.25rem] sm:px-4",
                        isHome ? "font-bold" : "font-medium",
                      )}
                    >
                      {label}
                    </a>
                  );
                })}
              </div>
            </nav>

            <a
              href="tel:+919899088710"
              className="mt-4 flex items-center gap-3 rounded-2xl border-[3px] border-[#B92E2E] bg-white px-3 py-2.5 no-underline shadow-sm sm:hidden"
            >
              <HeadphonesIcon className="h-9 w-9 shrink-0" />
              <span className="text-left">
                <span className="block text-sm font-bold text-[#101828]">Talk to an Expert</span>
                <span className="block text-xs font-semibold text-[#706767]">+91 98990 88710</span>
              </span>
            </a>
          </header>

          <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-6 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:items-center lg:gap-14 lg:px-8 lg:pt-6">
            <div className="max-w-xl lg:max-w-none">
              <h1
                className="mk-home-reveal text-[clamp(2rem,4.2vw,3.55rem)] leading-[1.12] tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-mk-pt-serif), ui-serif, Georgia, serif" }}
              >
                <span className="font-semibold text-[#1D3557]">Your </span>
                <span className="font-bold text-[#B92E2E]">Gateway </span>
                <span className="font-semibold text-[#1D3557]">To </span>
                <span className="font-bold text-[#1D3557]">World-Class </span>
                <span className="font-semibold text-[#1D3557]">Education</span>
              </h1>

              <form onSubmit={onSearchSubmit} className="mk-home-reveal mt-8 max-w-[34rem]">
                <div className="flex items-stretch overflow-hidden rounded-[1.25rem] border-[3px] border-[#B92E2E] bg-white shadow-[inset_0_2px_6px_rgba(29,53,87,0.06),0_12px_32px_rgba(29,53,87,0.08)]">
                  <span className="flex shrink-0 items-center pl-4 text-[#1D3557]/45">
                    <SearchIcon className="h-6 w-6" />
                  </span>
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search for colleges, exams, courses and more.."
                    className="min-w-0 flex-1 border-0 bg-transparent py-4 pl-2 pr-3 font-[family-name:var(--font-mk-inter),sans-serif] text-base text-[#101828] outline-none placeholder:text-[#706767] sm:text-[1.05rem]"
                    aria-label="Search query"
                  />
                </div>
              </form>

              <div className="mk-home-reveal mt-8 flex flex-wrap gap-4">
                <a
                  href={STUDY_ABROAD_SITE}
                  className="relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#b92e2e] via-[#e63b40] to-[#ff6b6f] px-9 font-[family-name:var(--font-mk-inter),sans-serif] text-base font-semibold text-white no-underline shadow-[0_6px_0_#6e2424,0_14px_32px_rgba(185,46,46,0.4)] ring-1 ring-white/30 transition hover:brightness-105"
                >
                  <span className="relative z-[1]">Study Abroad</span>
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/15" aria-hidden />
                </a>
                <Link
                  href="/india"
                  className="relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#1d3557] via-[#2a4a73] to-[#4a6fa1] px-9 font-[family-name:var(--font-mk-inter),sans-serif] text-base font-semibold text-white no-underline shadow-[0_6px_0_#152a45,0_14px_32px_rgba(29,53,87,0.38)] ring-1 ring-white/25 transition hover:brightness-105"
                >
                  <span className="relative z-[1]">Study in India</span>
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/12" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[420px] justify-center lg:mr-0 lg:ml-auto lg:max-w-[440px]">
              <div className="relative aspect-square w-full max-w-[400px]">
                <div className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1D3557] shadow-[0_28px_64px_rgba(29,53,87,0.35),inset_0_-8px_24px_rgba(0,0,0,0.15)]" />

                <div className="absolute left-1/2 top-1/2 h-[84%] w-[84%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white/90 shadow-inner">
                  <Image
                    src="/hero-student.png"
                    alt="Smiling student giving a thumbs up, holding colourful folders"
                    fill
                    className="scale-[1.12] object-cover object-[center_15%]"
                    sizes="(min-width: 1024px) 400px, 90vw"
                    priority
                  />
                </div>

                <div className="absolute -left-1 top-[10%] z-20 hidden w-[9.5rem] rounded-2xl border border-[#B92E2E]/45 bg-white p-3 shadow-[0_16px_40px_rgba(29,53,87,0.18)] sm:block md:left-[-4%] md:w-[10.5rem]">
                  <IconLaptop className="mb-2 h-9 w-9 text-[#B92E2E]" />
                  <p className="font-[family-name:var(--font-mk-inter),sans-serif] text-xl font-bold leading-none text-[#101828]">
                    2K+
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-mk-inter),sans-serif] text-[0.68rem] font-medium leading-snug text-[#706767]">
                    Video Courses
                  </p>
                </div>

                <div className="absolute -right-1 top-[8%] z-20 hidden w-[9.5rem] rounded-2xl border border-[#B92E2E]/45 bg-white p-3 shadow-[0_16px_40px_rgba(29,53,87,0.18)] sm:block md:right-[-6%] md:w-[10.5rem]">
                  <IconProgressRing className="mb-2 h-9 w-9 text-[#B92E2E]" />
                  <p className="font-[family-name:var(--font-mk-inter),sans-serif] text-xl font-bold leading-none text-[#101828]">
                    5K+
                  </p>
                  <p className="mt-0.5 font-[family-name:var(--font-mk-inter),sans-serif] text-[0.68rem] font-medium leading-snug text-[#706767]">
                    Online Courses
                  </p>
                </div>

                <div className="absolute bottom-[4%] right-[4%] z-20 hidden w-[9.5rem] rounded-2xl border border-[#B92E2E]/45 bg-white p-3 shadow-[0_16px_40px_rgba(29,53,87,0.18)] sm:block md:right-[2%] md:w-[10.5rem] lg:bottom-[6%]">
                  <IconTutorBoard className="mb-2 h-9 w-9 text-[#B92E2E]" />
                  <p className="font-[family-name:var(--font-mk-inter),sans-serif] text-[0.68rem] font-medium uppercase tracking-wide text-[#706767]">
                    Tutors
                  </p>
                  <p className="font-[family-name:var(--font-mk-inter),sans-serif] text-xl font-bold leading-none text-[#101828]">
                    250+
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-center gap-3 sm:hidden">
                <div className="flex items-center gap-2 rounded-2xl border border-[#B92E2E]/35 bg-white px-3 py-2 shadow-md">
                  <IconLaptop className="h-8 w-8 shrink-0 text-[#B92E2E]" />
                  <div>
                    <p className="text-lg font-bold text-[#101828]">2K+</p>
                    <p className="text-[0.65rem] text-[#706767]">Video Courses</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[#B92E2E]/35 bg-white px-3 py-2 shadow-md">
                  <IconProgressRing className="h-8 w-8 shrink-0 text-[#B92E2E]" />
                  <div>
                    <p className="text-lg font-bold text-[#101828]">5K+</p>
                    <p className="text-[0.65rem] text-[#706767]">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-[#B92E2E]/35 bg-white px-3 py-2 shadow-md">
                  <IconTutorBoard className="h-8 w-8 shrink-0 text-[#B92E2E]" />
                  <div>
                    <p className="text-[0.65rem] font-semibold text-[#706767]">Tutors</p>
                    <p className="text-lg font-bold text-[#101828]">250+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-4 pt-2 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
              {HERO_DEST_EXAMS.map(({ flag, label, exam }) => (
                <div key={`${label}-${exam}`} className="flex flex-col items-center gap-2">
                  <div
                    className="flex w-full min-h-[3rem] items-center justify-center rounded-xl border border-white bg-gradient-to-b from-white via-[#f8f8f6] to-[#e8e8e4] px-2 py-2 text-center text-sm font-bold text-[#1D3557] shadow-[0_6px_0_rgba(29,53,87,0.12),0_10px_20px_rgba(29,53,87,0.1),inset_0_1px_0_rgba(255,255,255,0.9)] sm:min-h-[3.25rem] sm:text-base"
                    title={label}
                  >
                    <span className="mr-1.5 text-lg sm:text-xl" aria-hidden>
                      {flag}
                    </span>
                    <span className="hidden truncate sm:inline">{label}</span>
                  </div>
                  <div className="flex w-full min-h-[2.75rem] items-center justify-center rounded-xl bg-gradient-to-b from-[#2a4a73] via-[#1d3557] to-[#142a45] px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-white shadow-[0_5px_0_#0f1f33,0_8px_18px_rgba(29,53,87,0.35),inset_0_1px_0_rgba(255,255,255,0.15)] sm:text-sm">
                    {exam}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-4 w-full overflow-hidden border-t border-[#1D3557]/8 bg-[#FFFDF5] py-3 md:hidden">
            <div className="mk-figma-marquee gap-3 pr-3">
              {countryLoop.map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  className="inline-flex shrink-0 items-center rounded-[999px] border border-white/80 bg-gradient-to-b from-white to-[#f0f0ec] px-4 py-2 text-xs font-bold text-[#1D3557] shadow-md"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 w-full overflow-hidden bg-[#FFFDF5] py-3 md:hidden">
            <div className="mk-figma-marquee gap-2 pr-2">
              {courseLoop.map((c, i) => (
                <div
                  key={`${c}-${i}`}
                  className="inline-flex shrink-0 rounded-[10px] bg-gradient-to-b from-[#1d3557] to-[#142a45] px-5 py-2.5 font-[family-name:var(--font-mk-inter),sans-serif] text-sm font-semibold text-white shadow-md"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {mobileNavOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-black/45 lg:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <div
            id="mk-figma-drawer"
            className="fixed inset-y-0 right-0 z-[80] flex w-[min(20rem,calc(100%-1rem))] flex-col border-l border-[#e0e0e0] bg-[#FFFDF5] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#e0e0e0] px-4 py-3">
              <span className="text-base font-semibold text-[#202A3B]">Menu</span>
              <button
                type="button"
                className="rounded-md p-2 text-sm font-medium text-[#606060] hover:bg-black/5"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>
            <nav className="flex flex-1 flex-col overflow-y-auto p-2" aria-label="Primary mobile">
              {FIGMA_NAV.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="rounded-md px-4 py-3 text-base text-[#202A3B] no-underline hover:bg-[#B92E2E]/10"
                  onClick={() => setMobileNavOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link
                href="/search"
                className="rounded-md px-4 py-3 text-base text-[#202A3B] no-underline hover:bg-[#B92E2E]/10"
                onClick={() => setMobileNavOpen(false)}
              >
                Search
              </Link>
            </nav>
          </div>
        </>
      ) : null}

      <main id="mk-main">
        {/* —— About + What we do (Figma Page 2) —— */}
        <section
          id="about"
          className="relative scroll-mt-28 border-t border-black/5 bg-[#FFFDF5] py-16 sm:py-20"
        >
          <div className="pointer-events-none absolute inset-x-0 top-24 h-64 bg-gradient-to-r from-[#B92E2E]/15 via-transparent to-[#001D87]/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div className="mk-home-reveal space-y-6">
              <div className="relative">
                <div className="absolute -left-4 top-8 h-48 w-40 rotate-[-6deg] overflow-hidden rounded-xl border-2 border-[#B92E2E]/25 opacity-80 shadow-lg" aria-hidden>
                  <Image
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80"
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="relative ml-8 mt-16 aspect-[4/5] max-w-md overflow-hidden rounded-[14px] border-[3px] border-[#B92E2E]/35 shadow-xl">
                  <Image
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=900&h=1100&fit=crop"
                    alt="Students collaborating on campus"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="relative inline-flex flex-col items-start gap-2 pt-2">
                <h2 className="font-[family-name:var(--font-mk-pt-serif),serif] text-3xl font-bold leading-tight text-[#B92E2E] sm:text-4xl">
                  About Merrakii
                </h2>
                <span className="h-1 w-14 rounded-full bg-[#B92E2E]" aria-hidden />
              </div>
            </div>
            <div className="mk-home-reveal">
              <p className="whitespace-pre-line font-[family-name:var(--font-mk-inter),sans-serif] text-lg font-bold leading-relaxed text-[#101828] sm:text-[1.35rem]/8">
                {ABOUT_COPY}
              </p>
            </div>
          </div>

          <div
            id="what-we-do"
            className="relative mx-auto mt-20 max-w-7xl scroll-mt-28 px-4 sm:px-6 lg:px-8"
          >
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="mk-home-reveal relative min-h-[280px]">
                <div className="relative aspect-video w-full overflow-hidden rounded-[14px] shadow-lg">
                  <Image
                    src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
                    alt="Students learning in an academic setting"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="relative mt-6 inline-flex flex-col gap-2">
                  <span className="h-1 w-14 rounded-full bg-[#B92E2E]" aria-hidden />
                  <h2 className="font-[family-name:var(--font-mk-pt-serif),serif] text-3xl font-bold text-[#B92E2E] sm:text-4xl">
                    What we do
                  </h2>
                </div>
              </div>
              <div className="mk-home-reveal relative overflow-hidden rounded-2xl border border-[#B92E2E]/20 bg-[#1c2648] p-6 shadow-xl sm:p-10">
                <div
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(185,46,46,0.85) 0%, rgba(28,38,72,0.92) 55%, rgba(0,29,135,0.75) 100%)",
                  }}
                  aria-hidden
                />
                <p className="relative z-[1] text-justify font-[family-name:var(--font-mk-inter),sans-serif] text-lg font-bold leading-8 text-white sm:text-[1.35rem]/8">
                  {WHAT_WE_DO_COPY}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* —— Services + stats (Figma Page 3) —— */}
        <section id="services" className="scroll-mt-28 border-t border-black/5 bg-[#FFFDF5] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center">
              <div className="relative inline-block">
                <h2 className="font-[family-name:var(--font-mk-pt-serif),serif] text-3xl font-bold text-[#B92E2E] sm:text-[2.5rem]">
                  Why choose Merrakii
                </h2>
                <span className="absolute -bottom-2 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#B92E2E]/40" aria-hidden />
              </div>
              <div className="relative inline-block">
                <h3 className="font-[family-name:var(--font-mk-pt-serif),serif] text-2xl font-bold text-[#B92E2E] sm:text-3xl">
                  Services
                </h3>
                <span className="absolute -bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#B92E2E]/35" aria-hidden />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SERVICE_CARDS.map((title) => (
                <div
                  key={title}
                  className="mk-home-reveal relative flex min-h-[200px] flex-col justify-center overflow-hidden rounded-[23px] bg-[#001D87] px-5 py-8 text-center shadow-lg"
                >
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#FFFDF5]/20 via-transparent to-transparent opacity-90"
                    style={{ boxShadow: "inset 10px 10px 6px 2px rgba(255,255,255,0.22)" }}
                    aria-hidden
                  />
                  <p className="relative z-[1] whitespace-pre-line font-[family-name:var(--font-mk-inter),sans-serif] text-lg font-semibold leading-snug text-[#FEFEFE]">
                    {title}
                  </p>
                </div>
              ))}
            </div>

            <div className="mk-home-reveal mx-auto mt-16 max-w-5xl text-center">
              <div className="relative inline-block">
                <h2 className="font-[family-name:var(--font-mk-pt-serif),serif] text-3xl font-bold text-[#B92E2E] sm:text-[2.5rem]">
                  Our Success
                </h2>
                <span className="absolute -bottom-2 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-[#B92E2E]/40" aria-hidden />
              </div>
            </div>

            <div className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
              {(
                [
                  { n: "15K+", l: "Students" },
                  { n: "75 %", l: "Total success" },
                  { n: "35", l: "Main questions" },
                  { n: "26", l: "Chief experts" },
                  { n: "16", l: "Years of experience" },
                ] as const
              ).map(({ n, l }) => (
                <div key={l} className="mk-home-reveal text-center">
                  <p
                    className="bg-gradient-to-r from-[#B92E2E] to-[#001D87] bg-clip-text font-[family-name:var(--font-mk-pt-serif),serif] text-[clamp(2.5rem,6vw,4.5rem)] leading-none text-transparent"
                  >
                    {n}
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-mk-inter),sans-serif] text-lg text-[rgba(1,5,20,0.8)] md:text-xl">
                    {l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— CTA —— */}
        <section className="border-t border-black/5 bg-[#FFFDF5] px-4 py-20 sm:px-6">
          <div className="mk-home-reveal mx-auto max-w-3xl text-center">
            <p className="font-[family-name:var(--font-mk-sans),sans-serif] text-xs font-bold uppercase tracking-[0.22em] text-[#B92E2E]">
              Change your trajectory
            </p>
            <h2 className="mk-home-serif mt-4 text-4xl font-semibold text-[#202A3B] sm:text-5xl">
              Start your new chapter with us
            </h2>
            <p className="mt-4 font-[family-name:var(--font-mk-sans),sans-serif] text-base leading-relaxed text-[#7A6655]">
              Whether you are aiming overseas or doubling down on India, sign in with your mobile to continue your guided
              journey.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a
                href={STUDY_ABROAD_SITE}
                className="inline-flex min-h-[48px] items-center rounded-lg bg-gradient-to-br from-[#B92E2E] to-[#722018] px-8 py-3 font-[family-name:var(--font-mk-sans),sans-serif] text-sm font-semibold text-white no-underline shadow-[0_4px_14px_rgba(114,32,24,0.35)]"
              >
                Study Abroad
              </a>
              <Link
                href="/india"
                className="inline-flex min-h-[48px] items-center rounded-lg border-2 border-[#B92E2E] bg-white px-8 py-3 font-[family-name:var(--font-mk-sans),sans-serif] text-sm font-semibold text-[#B92E2E] no-underline"
              >
                Study in India
              </Link>
            </div>
          </div>
        </section>

        {/* —— Footer —— */}
        <footer id="contact" className="scroll-mt-28 border-t border-black/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 lg:grid-cols-4 lg:gap-8 xl:px-12">
            <div className="mk-home-reveal">
              <img src="/merrakii-logo.png" alt="MERRAKii" className="h-10 w-auto object-contain" />
              <p className="mt-4 text-sm leading-relaxed text-[#7A6655]">
                Munjal Universal Consultancy flagship — international education and disciplined India pathways for ambitious
                students.
              </p>
            </div>
            <div className="mk-home-reveal">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202A3B]">Explore</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/#top" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Home
                  </Link>
                </li>
                <li>
                  <a href={STUDY_ABROAD_SITE} className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Study Abroad
                  </a>
                </li>
                <li>
                  <Link href="/india" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Study in India
                  </Link>
                </li>
                <li>
                  <Link href="/fields" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Academic Fields
                  </Link>
                </li>
              </ul>
            </div>
            <div className="mk-home-reveal">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202A3B]">Programmes</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/exams" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Exams
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Search Institutes
                  </Link>
                </li>
                <li>
                  <Link href="/catalog" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Catalogue
                  </Link>
                </li>
                <li>
                  <Link href="/account" className="text-[#7A6655] no-underline hover:text-[#B92E2E]">
                    Account
                  </Link>
                </li>
              </ul>
            </div>
            <div className="mk-home-reveal">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202A3B]">Contact</h3>
              <address className="mt-4 space-y-2 text-sm not-italic leading-relaxed text-[#7A6655]">
                <p>
                  <a href="mailto:info@merrakii.co.in" className="text-[#B92E2E] hover:underline">
                    info@merrakii.co.in
                  </a>
                </p>
                <p>
                  <a href="tel:+919899088710" className="hover:text-[#B92E2E]">
                    +91 98990 88710
                  </a>
                </p>
                <p>
                  <a href="https://merrakii.co.in/" className="hover:text-[#B92E2E]">
                    merrakii.co.in
                  </a>
                </p>
              </address>
            </div>
          </div>
          <div className="border-t border-[#EAEAEA] px-4 py-4 sm:px-8 xl:px-12">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-[#7A6655] sm:flex-row">
              <p>© {new Date().getFullYear()} Merrakii · Munjal Universal Consultancy. All rights reserved.</p>
              <p>Designed for student success — India and the world.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
