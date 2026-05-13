"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { phoneSchema } from "@merrakii/shared";
import { Shell } from "@/components/Shell";
import { OtpModal } from "@/components/OtpModal";
import { api } from "@/lib/api";
import { getStoredUserLocation, saveStoredUserLocation, type StoredUserLocation } from "@/lib/user-location";

const highlights = [
  { t: "8 fields", d: "Medical to Defence" },
  { t: "40+ exams", d: "Major India tests" },
  { t: "Apply + pay", d: "One trusted flow" },
];

export default function IndiaHomePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [modal, setModal] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userLocation, setUserLocation] = useState<StoredUserLocation | null>(null);

  useEffect(() => {
    setUserLocation(getStoredUserLocation());
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const payload: StoredUserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          recordedAt: new Date().toISOString(),
        };
        saveStoredUserLocation(payload);
        setUserLocation(payload);
      },
      () => {
        /* User denied, blocked, or unavailable — no in-app UI */
      },
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 15_000 },
    );
  }, []);

  async function requestOtp() {
    setHint(null);
    const p = phoneSchema.safeParse(phone);
    if (!p.success) {
      setHint("Enter a valid 10+ digit phone number.");
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ ok: boolean; devHint?: string }>("/auth/otp/request", {
        method: "POST",
        json: { phone: p.data },
      });
      if (res.devHint) setHint(res.devHint);
      setModal(true);
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch lg:gap-12">
        <div className="dam-hero-band flex flex-col justify-center">
          <p className="dam-eyebrow">Students · India</p>
          <h1 className="dam-hero-title mt-4">
            Welcome to the{" "}
            <span className="dam-hero-highlight">Merrakii</span>
          </h1>
          <p className="dam-lead mt-5 max-w-xl">
            Explore academic fields and competitive exams, compare institutes and programs, then apply and pay
            securely — the same clarity you expect from a premium counselling journey.
          </p>

          {userLocation ? (
            <p className="mt-4 inline-flex max-w-xl flex-wrap items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
              <span aria-hidden>📍</span>
              <span>
                Area detected for this session (approx.{" "}
                {userLocation.lat.toFixed(2)}°, {userLocation.lng.toFixed(2)}°). Stored only in your browser.
              </span>
            </p>
          ) : null}

          <ul className="mt-8 flex flex-wrap gap-3">
            {highlights.map((h) => (
              <li
                key={h.t}
                className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <span className="text-sm font-bold text-[#f0d9a8]">{h.t}</span>
                <span className="text-xs text-white/75">{h.d}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/fields" className="dam-btn-gold no-underline">
              Browse academic fields
            </Link>
            <a href="#login" className="dam-btn-on-dark">
              Login with phone
            </a>
          </div>
        </div>

        <div id="login" className="dam-card-static flex flex-col justify-center border-t-4 border-t-[#e39632] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="dam-badge">OTP login</span>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-[var(--m-navy)]">Continue with mobile</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">No passwords — we send a one-time code.</p>
            </div>
            <div
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--m-cream)] sm:flex"
              aria-hidden
            >
              <span className="text-2xl">📱</span>
            </div>
          </div>

          <div className="dam-divider" />

          <label className="dam-label">Phone number</label>
          <input
            className="dam-input"
            placeholder="e.g. 9876543210 or +919876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
          {hint ? (
            <p className="mt-3 rounded-lg border border-[var(--m-burgundy)]/20 bg-[var(--m-burgundy-soft)] px-3 py-2 text-sm text-[var(--m-burgundy-dark)]">
              {hint}
            </p>
          ) : null}
          <button
            type="button"
            disabled={busy}
            className="dam-btn-primary mt-6 w-full"
            onClick={() => void requestOtp()}
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
          <p className="mt-4 text-center text-xs text-[var(--muted)]">
            By continuing you agree to the terms for this demo environment.
          </p>
        </div>
      </div>

      <OtpModal
        phone={phone}
        open={modal}
        onClose={() => setModal(false)}
        onAuthed={() => router.push("/search")}
      />
    </Shell>
  );
}
