"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Shell } from "@/components/Shell";
import { api } from "@/lib/api";

type PaymentCapabilities = {
  razorpayConfigured: boolean;
  dummyCheckoutAvailable: boolean;
};

type AppSummary = {
  id: string;
  status: string;
  program: {
    name: string;
    institute: { name: string; isPartner: boolean };
    paymentPlans: { amountPaise: number; currency: string; name: string }[];
  };
};

/** Demo UPI / VPA accepted on the Paytm-style checkout step. */
const DEMO_PAYTM_UPI = "dummy@pthdfc.com";

const WAIT_MS = 30_000;

type MethodId =
  | "UPI"
  | "CARD"
  | "NETBANKING"
  | "PAYTM"
  | "MOBIKWIK"
  | "NEFT"
  | "WALLET"
  | "EMI"
  | "RAZORPAY";

const METHOD_TILES: {
  id: MethodId;
  title: string;
  subtitle: string;
  badge?: string;
}[] = [
  { id: "UPI", title: "UPI", subtitle: "GPay, PhonePe, BHIM & more", badge: "UPI" },
  { id: "CARD", title: "Card", subtitle: "Visa, Mastercard, RuPay", badge: "CARD" },
  { id: "NETBANKING", title: "Net banking", subtitle: "50+ banks", badge: "NB" },
  { id: "PAYTM", title: "Paytm", subtitle: "Paytm UPI & wallet", badge: "Paytm" },
  { id: "MOBIKWIK", title: "MobiKwik", subtitle: "Wallet", badge: "MK" },
  { id: "NEFT", title: "NEFT / RTGS", subtitle: "Bank transfer", badge: "NEFT" },
  { id: "WALLET", title: "Other wallets", subtitle: "Amazon Pay, Freecharge…", badge: "W" },
  { id: "EMI", title: "EMI", subtitle: "Card EMI (select banks)", badge: "EMI" },
];

function normalizeUpi(s: string) {
  return s.trim().toLowerCase();
}

export default function PaymentPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  const router = useRouter();
  const [me, setMe] = useState<{ phone: string; email: string | null; name: string | null } | null>(null);
  const [caps, setCaps] = useState<PaymentCapabilities | null>(null);
  const [summary, setSummary] = useState<AppSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [dummyBusy, setDummyBusy] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  const [selectedMethod, setSelectedMethod] = useState<MethodId | null>(null);
  const [upiId, setUpiId] = useState("");
  const [upiPhase, setUpiPhase] = useState<"idle" | "waiting" | "success">("idle");
  const [waitSecondsLeft, setWaitSecondsLeft] = useState(0);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearWaitTimers = useCallback(() => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const [capRes, u, apps] = await Promise.all([
          api<PaymentCapabilities>("/payments/capabilities"),
          api<{ user: { phone: string; email: string | null; name: string | null } }>("/auth/me"),
          api<{ applications: AppSummary[] }>("/applications/mine"),
        ]);
        setCaps(capRes);
        setMe(u.user);
        const appRow = apps.applications.find((a) => a.id === applicationId);
        if (!appRow) {
          setError("Application not found.");
          return;
        }
        setSummary(appRow);
        setCardholderName(u.user.name ?? "Demo Student");
      } catch {
        setError("Sign in required.");
      }
    })();
  }, [applicationId]);

  useEffect(() => () => clearWaitTimers(), [clearWaitTimers]);

  const completeDummyPayment = useCallback(async () => {
    clearWaitTimers();
    setError(null);
    setDummyBusy(true);
    try {
      await api("/payments/dummy-complete", {
        method: "POST",
        json: { applicationId },
      });
      setUpiPhase("success");
      await new Promise((r) => setTimeout(r, 1200));
      router.push(`/payment/success?applicationId=${encodeURIComponent(applicationId)}`);
    } catch (e) {
      const body = (e as Error & { body?: { error?: string } }).body;
      setError(body?.error ?? (e instanceof Error ? e.message : "Demo payment failed"));
      setUpiPhase("idle");
    } finally {
      setDummyBusy(false);
    }
  }, [applicationId, router, clearWaitTimers]);

  async function payWithRazorpay() {
    setError(null);
    setPaying(true);
    try {
      const order = await api<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        applicationId: string;
      }>("/payments/create-order", {
        method: "POST",
        json: { applicationId },
      });

      if (!scriptReady || typeof window === "undefined" || !window.Razorpay) {
        setError("Payment script still loading — try again in a second.");
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Merrakii",
        description: summary?.program.name ?? "Program fee",
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api("/payments/confirm", {
              method: "POST",
              json: {
                applicationId: order.applicationId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            router.push(`/payment/success?applicationId=${encodeURIComponent(applicationId)}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Payment verification failed");
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          contact: me?.phone,
          email: me?.email ?? undefined,
        },
        theme: { color: "#b01f24" },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });
      rzp.open();
    } catch (e) {
      const body = (e as Error & { body?: { error?: string } }).body;
      setError(body?.error ?? (e instanceof Error ? e.message : "Could not start payment"));
      setPaying(false);
    }
  }

  async function payWithDummyCard() {
    setError(null);
    setDummyBusy(true);
    try {
      await api("/payments/dummy-complete", {
        method: "POST",
        json: { applicationId },
      });
      router.push(`/payment/success?applicationId=${encodeURIComponent(applicationId)}`);
    } catch (e) {
      const body = (e as Error & { body?: { error?: string } }).body;
      setError(body?.error ?? (e instanceof Error ? e.message : "Demo payment failed"));
    } finally {
      setDummyBusy(false);
    }
  }

  function startPaytmUpiWait() {
    setError(null);
    if (normalizeUpi(upiId) !== DEMO_PAYTM_UPI) {
      setError(`For this demo, enter the UPI ID exactly: ${DEMO_PAYTM_UPI}`);
      return;
    }
    clearWaitTimers();
    setUpiPhase("waiting");
    setWaitSecondsLeft(Math.ceil(WAIT_MS / 1000));

    tickRef.current = setInterval(() => {
      setWaitSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);

    waitTimerRef.current = setTimeout(() => {
      clearWaitTimers();
      void completeDummyPayment();
    }, WAIT_MS);
  }

  useEffect(() => {
    if (selectedMethod !== "UPI" && selectedMethod !== "PAYTM") {
      if (upiPhase === "waiting") {
        clearWaitTimers();
        setUpiPhase("idle");
        setWaitSecondsLeft(0);
      }
    }
  }, [selectedMethod, upiPhase, clearWaitTimers]);

  if (error && !summary) {
    return (
      <Shell>
        <div className="dam-card-static max-w-md p-6">
          <p className="font-medium text-[var(--danger)]">{error}</p>
          <Link href="/" className="dam-btn-primary mt-5 inline-flex no-underline">
            Home
          </Link>
        </div>
      </Shell>
    );
  }

  if (!summary || !caps) {
    return (
      <Shell>
        <p className="text-[var(--muted)]">Loading…</p>
      </Shell>
    );
  }

  const blocked = !["SUBMITTED", "PAYMENT_PENDING"].includes(summary.status);
  const plan = summary.program.paymentPlans[0];
  const amountRupee = plan ? plan.amountPaise / 100 : null;
  const currency = plan?.currency ?? "INR";
  const showRazorpay = caps.razorpayConfigured;
  const showDummy = caps.dummyCheckoutAvailable;

  const tilesWithRazorpay = showRazorpay
    ? [...METHOD_TILES, { id: "RAZORPAY" as const, title: "Razorpay", subtitle: "Test checkout (all methods)", badge: "RZP" }]
    : METHOD_TILES;

  return (
    <Shell>
      {showRazorpay ? (
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
          onLoad={() => setScriptReady(true)}
        />
      ) : null}
      <p className="dam-eyebrow">Checkout</p>
      <h1 className="dam-page-title mt-2">Secure payment</h1>
      <p className="dam-lead">
        {summary.program.name} · {summary.program.institute.name}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={summary.program.institute.isPartner ? "dam-badge" : "dam-badge dam-badge-navy"}>
          {summary.program.institute.isPartner ? "Partner enrollment path" : "Lead routing"}
        </span>
        <span className="text-sm text-[var(--muted)]">
          Application status: <span className="font-semibold text-[var(--m-navy)]">{summary.status}</span>
        </span>
      </div>

      {blocked ? (
        <div className="mt-8 max-w-xl rounded-xl border border-[#e39632]/40 bg-[#fff9ed] px-4 py-4 text-sm text-[var(--m-ink)]">
          This application is not awaiting payment (already processed or invalid state).
        </div>
      ) : (
        <>
          <div className="mt-10 max-w-4xl">
            <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--muted)]">Payment options</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Typical gateway methods are listed below. In this demo, card checkout and Paytm-style UPI use mock flows;
              Razorpay uses your test keys when configured.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {tilesWithRazorpay.map((m) => {
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedMethod(m.id);
                      setError(null);
                    }}
                    className={`rounded-xl border px-3 py-3 text-left transition sm:px-4 sm:py-4 ${
                      active
                        ? "border-[var(--m-burgundy)] bg-[var(--m-burgundy-soft)] ring-2 ring-[var(--m-burgundy)]/25"
                        : "border-[var(--border)] bg-white hover:border-[var(--m-navy)]/30"
                    }`}
                  >
                    <span className="inline-flex rounded-md bg-[var(--m-navy)]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[var(--m-navy)]">
                      {m.badge}
                    </span>
                    <p className="mt-2 text-sm font-bold text-[var(--m-navy)]">{m.title}</p>
                    <p className="mt-0.5 text-[0.7rem] leading-snug text-[var(--muted)]">{m.subtitle}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 min-h-[200px]">
              {selectedMethod == null ? (
                <div className="dam-card-static border border-dashed border-[var(--border-strong)] p-8 text-center text-sm text-[var(--muted)]">
                  Select a payment method above to continue.
                </div>
              ) : null}

              {selectedMethod === "RAZORPAY" && showRazorpay ? (
                <div className="dam-card-static border-t-4 border-t-[#e39632] p-6 sm:p-8">
                  <div className="flex items-center gap-3 border-b border-[var(--border)] pb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--m-burgundy-soft)] text-xl font-bold text-[var(--m-burgundy)]">
                      ₹
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--m-navy)]">Razorpay</p>
                      <p className="text-xs text-[var(--muted)]">Opens Razorpay checkout (cards, UPI, netbanking, wallets per your dashboard).</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={paying || !scriptReady}
                    className="dam-btn-primary mt-6 w-full max-w-md"
                    onClick={() => void payWithRazorpay()}
                  >
                    {!scriptReady ? "Loading checkout…" : paying ? "Opening…" : "Pay with Razorpay"}
                  </button>
                </div>
              ) : null}

              {selectedMethod === "CARD" && showDummy ? (
                <div className="dam-card-static border-t-4 border-t-[var(--m-burgundy)] p-6 sm:p-8">
                  <p className="text-sm font-semibold text-[var(--m-navy)]">Card payment (demo)</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Mock card fields — completes immediately in this environment.</p>
                  <div className="mt-6 grid max-w-md gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[var(--m-navy)]" htmlFor="demo-card-num">
                        Card number
                      </label>
                      <input
                        id="demo-card-num"
                        readOnly
                        className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 font-mono text-sm"
                        value="4242 4242 4242 4242"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[var(--m-navy)]" htmlFor="demo-card-name">
                        Name on card
                      </label>
                      <input
                        id="demo-card-name"
                        className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-[var(--m-navy)]">Expiry</label>
                        <input readOnly className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--m-cream)]/60 px-3 py-2.5 font-mono text-sm" value="12 / 30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-[var(--m-navy)]">CVV</label>
                        <input readOnly className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--m-cream)]/60 px-3 py-2.5 font-mono text-sm" value="***" />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={dummyBusy || amountRupee == null}
                    className="dam-btn-primary mt-6 w-full max-w-md"
                    onClick={() => void payWithDummyCard()}
                  >
                    {dummyBusy ? "Processing…" : `Pay ₹${amountRupee?.toLocaleString("en-IN") ?? "—"} with card`}
                  </button>
                </div>
              ) : null}

              {(selectedMethod === "PAYTM" || selectedMethod === "UPI") && showDummy ? (
                <div className="dam-card-static overflow-hidden border-t-4 border-t-[#00b9f5] p-0 sm:max-w-lg">
                  <div className="bg-gradient-to-r from-[#012b72] to-[#00b9f5] px-5 py-4 text-white">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-90">
                      {selectedMethod === "PAYTM" ? "Paytm checkout" : "UPI payment"}
                    </p>
                    <p className="mt-1 text-lg font-bold">Pay ₹{amountRupee?.toLocaleString("en-IN") ?? "—"}</p>
                    <p className="mt-1 text-xs opacity-90">{currency} · Merrakii</p>
                  </div>
                  <div className="space-y-4 p-5 sm:p-6">
                    {upiPhase === "idle" ? (
                      <>
                        <div>
                          <label htmlFor="paytm-upi" className="text-xs font-semibold text-[var(--m-navy)]">
                            UPI ID (VPA)
                          </label>
                          <input
                            id="paytm-upi"
                            type="text"
                            inputMode="email"
                            autoComplete="off"
                            placeholder="you@paytm"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--m-ink)] outline-none focus:border-[#00b9f5] focus:ring-2 focus:ring-[#00b9f5]/25"
                            aria-describedby="paytm-upi-hint"
                          />
                          <p id="paytm-upi-hint" className="mt-2 text-xs text-[var(--muted)]">
                            Demo: use <span className="font-mono font-semibold text-[var(--m-navy)]">{DEMO_PAYTM_UPI}</span>{" "}
                            — other VPAs are rejected in this build.
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={dummyBusy || amountRupee == null || upiPhase !== "idle"}
                          className="w-full rounded-xl bg-[#00b9f5] py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:opacity-50"
                          onClick={() => startPaytmUpiWait()}
                        >
                          Pay with UPI
                        </button>
                      </>
                    ) : null}

                    {upiPhase === "waiting" ? (
                      <div className="py-6 text-center" role="status" aria-live="polite">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[var(--border)] border-t-[#00b9f5]" />
                        <p className="mt-4 text-sm font-semibold text-[var(--m-navy)]">Processing your payment…</p>
                        <p className="mt-2 text-xs text-[var(--muted)]">
                          Please wait. This demo simulates bank confirmation ({waitSecondsLeft}s).
                        </p>
                      </div>
                    ) : null}

                    {upiPhase === "success" ? (
                      <div className="py-8 text-center" role="status" aria-live="polite">
                        <p className="text-2xl" aria-hidden>
                          ✓
                        </p>
                        <p className="mt-2 text-lg font-bold text-green-700">Payment successful</p>
                        <p className="mt-2 text-xs text-[var(--muted)]">Redirecting to your receipt…</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {selectedMethod &&
              selectedMethod !== "RAZORPAY" &&
              selectedMethod !== "CARD" &&
              selectedMethod !== "PAYTM" &&
              selectedMethod !== "UPI" ? (
                <div className="dam-card-static border border-[var(--border)] p-6 text-sm text-[var(--muted)]">
                  <p className="font-semibold text-[var(--m-navy)]">{METHOD_TILES.find((t) => t.id === selectedMethod)?.title ?? selectedMethod}</p>
                  <p className="mt-2 leading-relaxed">
                    This method is shown for illustration like a live gateway catalogue. It is not wired in this MVP —
                    use <strong className="text-[var(--m-ink)]">Paytm / UPI</strong> (demo VPA), <strong className="text-[var(--m-ink)]">Card</strong> (demo), or{" "}
                    <strong className="text-[var(--m-ink)]">Razorpay</strong> when keys are configured to complete payment.
                  </p>
                </div>
              ) : null}

              {selectedMethod === "CARD" && !showDummy ? (
                <div className="dam-card-static p-6 text-sm text-[var(--danger)]">Demo card checkout is not enabled on this server.</div>
              ) : null}

              {(selectedMethod === "PAYTM" || selectedMethod === "UPI") && !showDummy ? (
                <div className="dam-card-static p-6 text-sm text-[var(--danger)]">Demo Paytm UPI flow requires dummy checkout to be enabled.</div>
              ) : null}

              {selectedMethod === "RAZORPAY" && !showRazorpay ? (
                <div className="dam-card-static p-6 text-sm text-[var(--danger)]">Razorpay is not configured.</div>
              ) : null}
            </div>
          </div>

          {!showDummy && !showRazorpay ? (
            <div className="mt-8 dam-card-static max-w-2xl p-6 text-sm text-[var(--danger)]">
              Payment is not available: enable demo checkout (development) or configure Razorpay keys.
            </div>
          ) : null}

          {error ? <p className="mt-4 max-w-2xl text-sm text-[var(--danger)]">{error}</p> : null}
        </>
      )}

      <Link href="/account" className="mt-10 inline-flex text-sm font-semibold text-[var(--m-burgundy)] hover:underline">
        ← My applications
      </Link>
    </Shell>
  );
}
