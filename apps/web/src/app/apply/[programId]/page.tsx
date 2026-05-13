"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  APPLICATION_BOARD_VALUES,
  APPLICATION_LAST_PASSED_CLASS_VALUES,
  applicationCreateSchema,
  applicationDobMaxIso,
  applicationDobMinIso,
} from "@merrakii/shared";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";

export default function ApplyPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = use(params);
  const router = useRouter();
  const [me, setMe] = useState<{ phone: string } | null>(null);
  const [program, setProgram] = useState<{
    name: string;
    institute: { id: string; name: string; city: string; isPartner: boolean };
    exam: { name: string; field: { name: string } };
    paymentPlans: { amountPaise: number }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    dateOfBirth: "",
    gender: "PREFER_NOT_SAY" as "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_SAY",
    parentNamePrimary: "",
    parentNameSecondary: "",
    lastPassedClass: "",
    board: "",
    percentage: "",
    studyMode: "HYBRID" as "ONLINE" | "OFFLINE" | "HYBRID",
  });

  useEffect(() => {
    void (async () => {
      try {
        const u = await api<{ user: { phone: string } }>("/auth/me");
        setMe(u.user);
        const p = await api<{ program: NonNullable<typeof program> }>(`/catalog/programs/${programId}`);
        setProgram(p.program);
      } catch {
        setError("Sign in required to apply.");
      }
    })();
  }, [programId]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const payload = applicationCreateSchema.safeParse({
        programId,
        ...form,
        // Keep as string so shared schema can strip "%" and commas before parsing
        percentage: form.percentage,
      });
      if (!payload.success) {
        const flat = payload.error.flatten();
        const fieldLabels: Record<string, string> = {
          programId: "Program",
          name: "Full name",
          email: "Email",
          address: "Address",
          dateOfBirth: "Date of birth",
          gender: "Gender",
          parentNamePrimary: "Parent / guardian",
          parentNameSecondary: "Second parent",
          lastPassedClass: "Last passed class",
          board: "Board",
          percentage: "Percentage / CGPA",
          studyMode: "Study mode",
        };
        const lines = Object.entries(flat.fieldErrors).flatMap(([key, msgs]) => {
          const m = msgs?.filter(Boolean) ?? [];
          if (!m.length) return [];
          const label = fieldLabels[key] ?? key;
          return m.map((msg) => `${label}: ${msg}`);
        });
        setError(lines.length ? lines.join(" · ") : "Please check the form fields.");
        setBusy(false);
        return;
      }
      const res = await api<{ application: { id: string } }>("/applications", {
        method: "POST",
        json: payload.data,
      });
      router.push(`/payment/${res.application.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  if (!program && !error) {
    return (
      <Shell>
        <p className="text-[var(--muted)]">Loading program…</p>
      </Shell>
    );
  }

  if (error && !program) {
    return (
      <Shell>
        <div className="dam-card-static max-w-md p-6">
          <p className="font-medium text-[var(--danger)]">{error}</p>
          <Link href="/" className="dam-btn-primary mt-5 inline-flex no-underline">
            Go home to sign in
          </Link>
        </div>
      </Shell>
    );
  }

  const fee = program!.paymentPlans[0]?.amountPaise
    ? program!.paymentPlans[0].amountPaise / 100
    : null;

  return (
    <Shell>
      <nav className="text-sm text-[var(--muted)]">
        <Link href={`/institutes/${program!.institute.id}`} className="font-semibold text-[var(--m-burgundy)] hover:underline">
          {program!.institute.name}
        </Link>
        <span className="mx-2 text-[var(--border-strong)]">/</span>
        <span className="font-medium text-[var(--m-navy)]">{program!.name}</span>
      </nav>
      <p className="dam-eyebrow mt-5">Application</p>
      <h1 className="dam-page-title mt-2">Program application</h1>
      <p className="dam-lead">
        {program!.exam.field.name} · {program!.exam.name}
        {fee != null ? (
          <>
            {" "}
            · Fee from <strong className="font-semibold text-[#c27812]">₹{fee.toLocaleString("en-IN")}</strong>
          </>
        ) : null}
      </p>
      <div className="mt-6 max-w-2xl rounded-xl border border-[#e39632]/35 bg-[#fff9ed] px-4 py-3 text-sm leading-relaxed text-[var(--m-ink)]">
        <strong className="font-semibold text-[#c27812]">Documents:</strong> upload is deferred for this MVP — you
        will be able to add identity documents from your account later.
      </div>

      <div className="dam-card-static mt-10 max-w-2xl p-6 sm:p-8">
        <div className="grid gap-5 sm:gap-6">
        <Field label="Full name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
        <div>
          <label className="dam-label">Phone (from account)</label>
          <input className="dam-input" readOnly value={me?.phone ?? ""} />
        </div>
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        />
        <Field
          label="Address"
          value={form.address}
          onChange={(v) => setForm((f) => ({ ...f, address: v }))}
          multiline
        />
        <Field
          label="Date of birth"
          type="date"
          value={form.dateOfBirth}
          onChange={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
          min={applicationDobMinIso(100)}
          max={applicationDobMaxIso(10)}
          hint="You must be at least 10 years old. The latest allowed birth date is 10 years before today."
        />
        <div>
          <label className="dam-label">Gender</label>
          <select
            className="dam-select"
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                gender: e.target.value as typeof f.gender,
              }))
            }
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_SAY">Prefer not to say</option>
          </select>
        </div>
        <Field
          label="Parent / guardian name"
          value={form.parentNamePrimary}
          onChange={(v) => setForm((f) => ({ ...f, parentNamePrimary: v }))}
        />
        <Field
          label="Second parent name (optional)"
          value={form.parentNameSecondary}
          onChange={(v) => setForm((f) => ({ ...f, parentNameSecondary: v }))}
        />
        <div>
          <label htmlFor="apply-last-class" className="dam-label">
            Last passed class
          </label>
          <select
            id="apply-last-class"
            className="dam-select"
            value={form.lastPassedClass}
            onChange={(e) => setForm((f) => ({ ...f, lastPassedClass: e.target.value }))}
          >
            <option value="">Select class…</option>
            {APPLICATION_LAST_PASSED_CLASS_VALUES.map((c) => (
              <option key={c} value={c}>
                {c === "UG" ? "UG (undergraduate)" : c === "PG" ? "PG (postgraduate)" : `Class ${c}`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="apply-board" className="dam-label">
            Board / university
          </label>
          <select
            id="apply-board"
            className="dam-select"
            value={form.board}
            onChange={(e) => setForm((f) => ({ ...f, board: e.target.value }))}
          >
            <option value="">Select board or university…</option>
            {APPLICATION_BOARD_VALUES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <Field
          label="Percentage / CGPA equivalent"
          value={form.percentage}
          onChange={(v) => setForm((f) => ({ ...f, percentage: v }))}
          hint="Enter a number from 0–100 (a % sign at the end is fine)."
        />
        <div>
          <label className="dam-label">Study mode</label>
          <select
            className="dam-select"
            value={form.studyMode}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                studyMode: e.target.value as typeof f.studyMode,
              }))
            }
          >
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        </div>

        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

        <div className="flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
          <button type="button" disabled={busy} className="dam-btn-primary" onClick={() => void submit()}>
            {busy ? "Submitting…" : "Submit & continue to payment"}
          </button>
          <Link href="/fields" className="dam-btn-secondary no-underline">
            Cancel
          </Link>
        </div>
      </div>
    </Shell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline,
  hint,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  hint?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label className="dam-label">{label}</label>
      {multiline ? (
        <textarea
          className="dam-input dam-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="dam-input"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
