"use client";

import { useState } from "react";
import { phoneSchema } from "@merrakii/shared";
import { api } from "@/lib/api";

type Props = {
  phone: string;
  open: boolean;
  onClose: () => void;
  onAuthed: () => void;
};

export function OtpModal({ phone, open, onClose, onAuthed }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const p = phoneSchema.safeParse(phone);
      if (!p.success) {
        setError("Invalid phone");
        setLoading(false);
        return;
      }
      await api<{ ok: boolean }>("/auth/otp/verify", {
        method: "POST",
        json: { phone: p.data, code },
      });
      onAuthed();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--m-navy-deep)]/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-title"
    >
      <div className="dam-card-static w-full max-w-md border-t-4 border-t-[#e39632] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--m-burgundy-soft)] text-lg text-[var(--m-burgundy)]">
            🔐
          </div>
          <div>
            <h2 id="otp-title" className="text-lg font-bold text-[var(--m-navy)]">
              Enter verification code
            </h2>
            <p className="text-xs text-[var(--muted)]">Sent to {phone || "your number"}</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
          In local development, use the OTP from the hint on the home screen (default{" "}
          <code className="rounded-md bg-[var(--m-cream)] px-1.5 py-0.5 text-xs font-semibold text-[var(--m-burgundy)]">
            123456
          </code>
          ).
        </p>
        <label className="dam-label mt-5">One-time password</label>
        <input
          className="dam-input text-center text-lg tracking-[0.35em] placeholder:tracking-normal"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="••••••"
          inputMode="numeric"
          autoFocus
        />
        {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
        <div className="mt-8 flex justify-end gap-2 border-t border-[var(--border)] pt-6">
          <button type="button" className="dam-btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            className="dam-btn-primary min-w-[140px]"
            onClick={() => void verify()}
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}
