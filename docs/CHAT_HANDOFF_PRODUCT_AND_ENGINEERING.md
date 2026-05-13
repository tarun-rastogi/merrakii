# Merrakii — engineering handoff (from implementation chats)

This document summarizes **product-relevant engineering work** completed in Cursor chats so it can feed a **separate conversation** on business plan, functional scope, cost, timelines, and roadmap. It is not a business plan itself; it is a **factual record of what exists and how it behaves**.

---

## 1. Product snapshot (what the app is)

- **Name / positioning:** Merrakii — browse **fields → exams → institutes → programs**, apply with a structured form, pay (Razorpay test mode and/or **demo checkout**), then see **enrollment-style confirmation**.
- **Audience (MVP framing):** Students in India exploring competitive exams and institute programs; **partner** institutes get an enrollment-oriented post-payment path; **non-partner** listings route as **qualified leads** after payment.
- **Auth:** Phone OTP (dev-friendly fixed OTP documented elsewhere in repo); session cookie against API.
- **Visual / UX theme:** Light “premium counselling” style — burgundy `#B01F24`, navy `#0C226B`, gold `#E39632`, cream; **Source Sans 3**; shared chrome via `Shell` (nav: home, all exams, fields, account).

---

## 2. Technical architecture (for planning dependencies)

| Layer | Stack | Notes |
|--------|--------|--------|
| Monorepo | npm workspaces | `apps/api`, `apps/web`, `packages/shared` |
| API | Fastify, Prisma, PostgreSQL | Cookie sessions, CORS to web origin |
| Web | Next.js 15 (App Router), Turbopack dev | Default dev port **3002** |
| Shared | Zod schemas | `applicationCreateSchema`, phone/OTP schemas |
| DB | Docker Compose Postgres | Typical host port **5433** (see repo `docker-compose.yml`) |

**Default local URLs**

- Web: `http://localhost:3002`
- API: `http://localhost:4000` under `/api/*`
- Web calls API via `NEXT_PUBLIC_API_URL` (fallback `http://localhost:4000/api`)

**Important env (API, partial list)**

- `DATABASE_URL`, `WEB_ORIGIN` (must match web origin, e.g. `http://localhost:3002`)
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` — optional; if missing, **Razorpay create-order** returns 503
- `ALLOW_DUMMY_PAYMENTS` — `true` / `1` enables demo checkout **outside** `NODE_ENV=development` (see §4)
- `DEV_OTP` — dev OTP for login

---

## 3. User journeys implemented (functional features)

### 3.1 Discovery & catalog

- Browse **all exams** (grouped by field) — e.g. `/exams`
- Browse **fields** and drill into exams / institutes / programs
- Program detail surfaces institute, exam context, and **fee from payment plan** when present

### 3.2 Application (apply)

- Authenticated user opens **program application** — `/apply/[programId]`
- Collects: name, email (from account: phone read-only), address, DOB, gender, parent names, class, board, **percentage / CGPA equivalent**, study mode
- Submit creates `Application` with status **`SUBMITTED`** and redirects to **`/payment/[applicationId]`**

**Validation improvements (engineering detail for support / QA)**

- Shared Zod schema trims strings, clearer messages, **percentage** accepts values like `88%` (strips `%`, commas) instead of failing from `NaN`
- Client surfaces **field-level Zod messages** instead of only “Please check the form fields.”
- Hints on DOB and percentage fields

### 3.3 Payment

**Capabilities**

- `GET /api/payments/capabilities` — `{ razorpayConfigured, dummyCheckoutAvailable }`
- **Dummy checkout** is available when `NODE_ENV === "development"` **or** `ALLOW_DUMMY_PAYMENTS` is set

**Razorpay path (test keys)**

- `POST /api/payments/create-order` — creates Razorpay order, `PaymentDetail` in `CREATED`, application often **`PAYMENT_PENDING`**
- Client loads Razorpay script; on success, `POST /api/payments/confirm` verifies signature and sets application to **`ENROLLMENT_PENDING`** (partner) or **`LEAD_SENT`** (non-partner)

**Demo / dummy path (no external gateway)**

- `POST /api/payments/dummy-complete` — records **CAPTURED** payment and same **post-pay statuses** as real confirm (partner vs non-partner)
- UI: **“Demo checkout”** card on payment page — fake card line (`4242…`), editable cardholder label, **Pay & confirm enrollment**

### 3.4 Post-payment confirmation

- Success route: `/payment/success?applicationId=…`
- Loads **`GET /api/applications/:applicationId`** (owner-only) and shows **enrollment-oriented confirmation**: course, exam, institute, student name, **enrollment reference** (application UUID), amount paid when captured, status, partner vs non-partner messaging

### 3.5 Account

- **My applications** — list includes payment plan snippet where applicable (extended `GET /api/applications/mine`)

---

## 4. Application & payment domain model (for roadmap / compliance talk)

**Application statuses (Prisma enum)** — high level:

- `DRAFT` → (MVP apply flow creates directly) **`SUBMITTED`**
- **`PAYMENT_PENDING`** — after Razorpay order creation
- **`ENROLLMENT_PENDING`** — partner path after successful payment
- **`LEAD_SENT`** — non-partner path after successful payment  
- `PAID` exists in enum; confirm with schema if used in all paths

**Payment records**

- `PaymentDetail` links user, application, plan; Razorpay ids optional; status includes `CREATED` / `CAPTURED`

**Business implications to carry into the business chat**

- **Single stack** supports both **transactional enrollment narrative** (partners) and **lead generation** (non-partners) with the **same** student checkout UX
- **Dummy checkout** is explicitly a **demo/staging** affordance — document policy for production (off by default except explicit flag)

---

## 5. Engineering operations (dev experience & stability)

### 5.1 Port and origin conventions

- Web dev on **3002** (3000/3001 conflicts common); API **4000**
- `WEB_ORIGIN` must stay aligned with the web app URL for cookies/CORS

### 5.2 `dev:restart` and `scripts/restart-dev.sh`

- **Problem solved:** `EADDRINUSE` on **4000** when only killing listeners — **`tsx watch`** and multiple **`concurrently`** trees respawned children
- **Script behavior:** `pkill` patterns for this repo’s `concurrently`, `tsx watch`, and `next dev` (this repo’s `node_modules/.bin`), then frees **3002** (web) and **4000** (API)
- **npm script:** `npm run dev:restart` → restart script → `npm run dev` (runs `predev` → builds `@merrakii/shared`)

### 5.3 Agent / team rule

- Cursor rule documents: after material code changes, run **`npm run dev:restart`** (background ok) so the site stays healthy
- **Operational discipline:** avoid multiple parallel `npm run dev` for the same repo

### 5.4 Documentation touched in repo

- `README.md` — `dev:restart` and single-instance guidance
- `.cursor/rules/dev-server.mdc` — restart expectations for agents

---

## 6. File / route index (for estimates and ownership)

**Web (Next.js)**

- `apps/web/src/app/page.tsx` — home / OTP; post-login navigation (e.g. exams)
- `apps/web/src/app/exams/*`, `fields/*`, `institutes/*`, `apply/[programId]/page.tsx`
- `apps/web/src/app/payment/[applicationId]/page.tsx` — Razorpay + **demo checkout**
- `apps/web/src/app/payment/success/page.tsx` — **enrollment confirmation** (client + Suspense)
- `apps/web/src/components/Shell.tsx` — global nav / chrome
- `apps/web/src/app/globals.css`, `layout.tsx` — theme + font

**API**

- `apps/api/src/routes/payments.ts` — capabilities, create-order, confirm, **dummy-complete**
- `apps/api/src/routes/applications.ts` — create, mine (with payment plans), **get by id**
- `apps/api/src/config.ts` — **`ALLOW_DUMMY_PAYMENTS_ENABLED`** derivation
- `apps/api/prisma/schema.prisma` — domain enums and models

**Shared**

- `packages/shared/src/schemas.ts` — **`applicationCreateSchema`** (trim, percentage preprocess, messages)

**Scripts**

- `scripts/restart-dev.sh` — full dev process teardown + port cleanup

---

## 7. What this handoff does **not** include

- Pricing strategy, GTM, legal, Razorpay **live** certification, institute contracts, or staffing **timelines** — those belong in the **business plan chat**
- Production deployment topology, monitoring, and SLOs — not fully specified here
- Document upload / S3 — explicitly deferred in UI (“upload later” MVP copy)

---

## 8. Suggested prompts for the business-planning chat

Paste a short pointer like:

> Use `docs/CHAT_HANDOFF_PRODUCT_AND_ENGINEERING.md` in the Merrakii repo as the **source of truth for current MVP behavior**, routes, partner vs non-partner flows, payment modes (Razorpay vs dummy), and dev constraints. Build the business plan, feature roadmap, cost model, and timelines **on top of that baseline**, and call out gaps explicitly.

---

*Generated to align an engineering implementation thread with business / roadmap discussions. Update this file when major flows or env contracts change.*
