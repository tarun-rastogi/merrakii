# Product Requirements Document — Merrakii

**Product:** Intelligent digital channel for guided academic discovery, application, and enrollment  
**Primary artifact sources:** Executive narrative (`deliverable/digi.html`), engineering implementation summary (`docs/CHAT_HANDOFF_PRODUCT_AND_ENGINEERING.md`), and product discussion threads in Cursor.  
**Status:** Living document — MVP behavior is **partially implemented** in-repo; several deck items describe **target** capabilities.  
**Last updated:** April 2026  

---

## 1. Purpose of this document

This PRD aligns **what we are building** (and why) with **what already exists** in the codebase. It is intended for product, engineering, and commercial stakeholders. It is **not** a business plan, legal memo, or detailed technical design.

**Companion references**

- `docs/CHAT_HANDOFF_PRODUCT_AND_ENGINEERING.md` — authoritative for **current** routes, env vars, payment modes, and domain enums.  
- `deliverable/digi.html` — executive story arc (vision, market reality, product promise, AI story, roadmap framing).

---

## 2. Executive summary

Merrakii is a **student-centered** surface to move from **interest in a field or exam** through **program discovery**, **structured application**, **payment**, and **post-payment confirmation**, with fulfillment semantics that depend on **institute partnership** (enrollment-oriented path vs qualified lead path).

The **north-star outcome** is to **empower confident academic decisions through intelligent guidance** and to reduce friction where students today face **choice overload**, **opaque institute discovery**, **fragmented research**, and **enrollment friction**.

**Implemented today (MVP stack):** Web application (Next.js), API (Fastify + Prisma + PostgreSQL), phone OTP auth, catalog browsing (fields → exams → institutes → programs), apply flow, Razorpay (test) and **demo checkout**, and enrollment-style confirmation.  

**Articulated as roadmap / not fully specified in handoff:** Deep AI (copilots, document intelligence, predictive ops), native iOS/Android apps, CMS, notifications, CRM, advanced analytics, document upload to object storage.

---

## 3. Problem statement (market reality)

### 3.1 Headline problem

**Students struggle to convert intent into enrollment.** Structural inefficiencies persist across the admissions journey, creating friction for learners and limiting institutional growth.

### 3.2 Problem themes (diagnostic framing)

| Theme | Description |
|--------|-------------|
| **Choice overload** | Too many options delay confident academic decisions. |
| **Institute discovery gap** | Evaluating institutions stays hard when signals, fees, and outcomes sit in disconnected formats and channels. |
| **Fragmented discovery** | Research is scattered across portals, PDFs, and chat threads, with no single surface to weigh options side by side. |
| **Enrollment friction** | Manual workflows cause delays and drop-offs before admission. |

---

## 4. Vision & product principles

### 4.1 Vision (narrative)

- Build an **intelligent academic marketplace** so students and guardians can **discover** the right field of study, **connect** with trusted institutions, and **begin** their journey with **AI-driven guidance** and transparent access to education.  
- **Democratize access** to quality education through **personalized discovery**, **informed decisions**, and **frictionless enrollment** in one digital marketplace.

### 4.2 Product principles

1. **One journey** — From interest toward a confirmed seat without unnecessary channel-hopping.  
2. **Clarity over clutter** — Predictable layouts, plain language, focused flows.  
3. **Partner-aware** — Same learner experience while respecting partner vs non-partner commercial and operational rules.  
4. **Trust & auditability** — Payments, receipts, and records suitable for operational and compliance conversations (exact policies TBD with legal/ops).  
5. **AI as embedded capability** — Not only a bolt-on chatbot; guidance, matching, and operations support across the marketplace (target state).

---

## 5. Product goals & success metrics (proposed)

Goals should be validated with leadership; initial candidates:

| Goal | Indicative metrics |
|------|---------------------|
| Reduce drop-off between intent and application | Funnel conversion: catalog view → apply start → submit |
| Improve completion of payment | Submit → payment initiated → captured |
| Reduce missed deadlines / awareness gaps | Notifications & reminders (when built); support ticket themes |
| Institute satisfaction | Time-to-first-qualified-lead or enrollment pipeline (partner-specific) |
| Operational efficiency | Counselor rework rate, duplicate submissions (when multi-role surfaces exist) |

---

## 6. Users & stakeholders

| Actor | Needs (summary) |
|--------|------------------|
| **Student / guardian** | Discover exams and programs, compare options, apply with clear validation, pay safely, receive unambiguous next steps. |
| **Partner institute** | Enrollment-oriented confirmation after payment; consistent data handoff. |
| **Non-partner institute** | Qualified lead flow after payment where applicable. |
| **Platform operator / Merrakii** | Configurable catalog, payment integrity, audit trail, ability to demo without live gateway. |
| **Future: counselor / teacher** | Shared thread from prospect to classroom (deck USP — not fully reflected in current handoff). |

---

## 7. Scope

### 7.1 In scope — **implemented** (baseline MVP)

Aligned with `CHAT_HANDOFF_PRODUCT_AND_ENGINEERING.md`:

- **Authentication:** Phone OTP; session cookie against API; dev OTP documented for engineering.  
- **Discovery:** Browse exams (by field), fields, institutes, programs; program detail with fee context when payment plan exists.  
- **Application:** Authenticated apply at `/apply/[programId]` with structured fields (identity, academics, study mode, etc.); shared Zod validation (trim, percentage normalization, clearer errors).  
- **Payment:** Capability probe; Razorpay order creation and confirm when configured; **dummy / demo checkout** in development or when explicitly allowed by env.  
- **Post-payment:** Owner-only application fetch; confirmation UI with status, reference, partner vs non-partner messaging.  
- **Account:** “My applications” with payment plan snippet where applicable.

### 7.2 In scope — **target / phased** (from deck & discussions)

Explicitly **not** fully described as built in the engineering handoff:

- **AI:** Semantic discovery, match scoring, document capture/validation, embedded copilots, “next best action,” queue/risk forecasting (see §9).  
- **Channels:** Native **iOS** and **Android** apps with shared API, SSO, telemetry (deck — implementation not in handoff).  
- **Phase 2–3 roadmap themes:** CMS governance, onboarding, notifications, reporting; verification, CRM, analytics, automation.  
- **Document upload** to durable storage (called out as deferred in handoff).

### 7.3 Out of scope (for this PRD)

- Pricing, GTM, contracts, live payment certification.  
- Full compliance sign-off (minors, consent, retention) — requires legal input.  
- Production SLOs, on-call, monitoring — to be defined operationally.

---

## 8. Functional requirements

Requirements are tagged: **[MVP]** implemented baseline, **[Roadmap]** planned / partial.

### 8.1 Catalog & discovery

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-CAT-01 | User can browse exams grouped by field | P0 | [MVP] |
| FR-CAT-02 | User can navigate fields → exams → institutes → programs | P0 | [MVP] |
| FR-CAT-03 | Program detail shows institute, exam context, and fee when plan exists | P0 | [MVP] |
| FR-CAT-04 | Semantic / AI-assisted search and explainable program matching | P1 | [Roadmap] |

### 8.2 Identity & session

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-AUTH-01 | User can sign in with phone OTP | P0 | [MVP] |
| FR-AUTH-02 | Session established via secure cookie; API enforces ownership on application reads | P0 | [MVP] |
| FR-AUTH-03 | SSO for institutional roles | P2 | [Roadmap] |

### 8.3 Application (intake)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-APP-01 | Authenticated user can submit application for a program; creates `SUBMITTED` application | P0 | [MVP] |
| FR-APP-02 | Client and server validate with shared schema; field-level error messages | P0 | [MVP] |
| FR-APP-03 | User is routed to payment after successful submit | P0 | [MVP] |
| FR-APP-04 | AI-assisted parsing/validation of uploaded documents | P2 | [Roadmap] |

### 8.4 Payment

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-PAY-01 | Client can query payment capabilities (Razorpay vs dummy availability) | P0 | [MVP] |
| FR-PAY-02 | User can complete Razorpay test flow when keys configured | P0 | [MVP] |
| FR-PAY-03 | User can complete demo checkout when policy allows | P0 | [MVP] |
| FR-PAY-04 | Successful payment sets application to partner **`ENROLLMENT_PENDING`** or non-partner **`LEAD_SENT`** per business rules | P0 | [MVP] |

### 8.5 Confirmation & account

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-ACC-01 | User sees enrollment-oriented confirmation after success, including reference and status | P0 | [MVP] |
| FR-ACC-02 | User can list own applications with payment context | P0 | [MVP] |

### 8.6 Omnichannel (target)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-CH-01 | Responsive web shell for student (and future counselor/admin) workspaces | P0 | [MVP] partial |
| FR-CH-02 | Native iOS app (SwiftUI-oriented UX, push, Face ID) | P2 | [Roadmap] |
| FR-CH-03 | Native Android app (Kotlin/Jetpack, FCM, deep links) | P2 | [Roadmap] |
| FR-CH-04 | Shared API, design tokens, SSO, audit/telemetry across channels | P2 | [Roadmap] |

---

## 9. AI capabilities (target decomposition)

Deck narrative decomposes **how** AI should compound value. These are **requirements for a future revision** of the product unless otherwise implemented and linked in the handoff.

| Capability | Expected behavior (high level) |
|------------|--------------------------------|
| **Intelligent discovery** | Semantic search; program matching with explainable recommendations across fields, exams, institutes, programs. |
| **Document intelligence** | Classify and validate application materials; reduce round trips. |
| **Guided assistance** | Embedded copilots for students and counselors; answers with guardrails and citations to catalog rules. |
| **Predictive operations** | Surface bottlenecks, prioritize queues, recommend next best action for speed and compliance. |

**Current state:** The live MVP described in the handoff does **not** enumerate these AI features as shipped; treat as roadmap unless a future engineering note supersedes this.

---

## 10. User journeys (happy paths)

### 10.1 Student: discover → apply → pay → confirm

1. Land on web app; complete phone OTP.  
2. Browse fields/exams; open program detail.  
3. Start apply; complete structured form; submit (`SUBMITTED`).  
4. Land on payment; choose Razorpay or demo checkout per capabilities.  
5. On success: application transitions to **`ENROLLMENT_PENDING`** (partner) or **`LEAD_SENT`** (non-partner).  
6. View confirmation page with course, institute, reference, amount when captured.  
7. Return later via “My applications.”

### 10.2 Demo / sales

1. Same as 10.1 but uses **dummy checkout** where policy allows, without live gateway.

---

## 11. Business rules (fulfillment)

- **Single checkout UX** supports both **transactional enrollment narrative** (partners) and **lead generation** (non-partners).  
- Exact partner determination, contracts, and institute onboarding are **business inputs** (see §13), not encoded in this PRD.

---

## 12. Non-functional requirements

| Area | Requirement |
|------|-------------|
| **Security** | Session-bound access to applications; CORS and cookie settings aligned across web/API origins. |
| **Reliability** | Payment and application state transitions must be consistent; verify signatures on real gateway path. |
| **Maintainability** | Shared Zod schemas between client and API for application payload. |
| **Operability** | Documented env flags for demo payments; dev restart discipline for local multi-process dev. |
| **Accessibility** | Executive deck emphasizes keyboard navigation for HTML deck; web app should follow WCAG targets per future explicit requirement (not fully specified in handoff). |

---

## 13. Dependencies & inputs (from deck)

Delivery depends on client-supplied inputs, including:

- Catalog & economics (programs, fees, partner rules).  
- Brand & policy (copy, assets, legal, refunds).  
- Payments (gateway, KYC, settlement).  
- Operating model (queries, liaison, leads).  
- Compliance (retention, consent, minors).  
- Infrastructure (domain, hosting, launch window).

---

## 14. Roadmap phasing (product framing)

| Phase | Theme | Representative capabilities |
|-------|--------|-----------------------------|
| **1 — Foundation** | End-to-end student journey | Catalog, apply, pay, confirm, partner logic, account |
| **2 — Leverage** | Operations & content | CMS governance, onboarding, notifications, reporting |
| **3 — Scale** | Depth & automation | Verification, CRM, analytics, automation |

Depth per phase is **jointly agreed** with stakeholders.

---

## 15. Open questions

1. **AI:** Which AI capabilities ship in which phase, and what model/provider constraints apply (privacy, region, cost)?  
2. **Mobile:** Timeline and feature parity vs web for iOS/Android.  
3. **Documents:** When file upload, virus scan, and retention policies are required.  
4. **Roles:** Counselor/teacher workspaces — MVP cut vs Phase 2.  
5. **Analytics:** Event taxonomy and reporting ownership.  
6. **Localization:** Languages, date formats, and regional payment methods beyond current scope.

---

## 16. Revision history

| Version | Date | Notes |
|---------|------|--------|
| 0.1 | 2026-04 | Initial PRD from handoff + executive deck + Cursor product discussions |

---

*Update this document when MVP scope changes materially or when roadmap items are implemented and verified in production.*
