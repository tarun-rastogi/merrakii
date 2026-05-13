# Merrakii (local MVP)

Monorepo: **Fastify + Prisma + PostgreSQL** API (`apps/api`) and **Next.js** web app (`apps/web`). Shared validation/types live in `packages/shared` (`@merrakii/shared`) for future React Native reuse.

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL), or any PostgreSQL 16 instance
- Razorpay **test** keys for end-to-end payments ([Dashboard → API Keys](https://dashboard.razorpay.com/app/keys))

## Quick start

1. **Start database**

   ```bash
   docker compose up -d
   ```

   Default URL in `apps/api/.env.example` uses port **5433** to avoid clashing with a local Postgres on 5432.

2. **Install dependencies**

   ```bash
   npm install
   npm run build -w @merrakii/shared
   ```

3. **Configure environment**

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

   Add your Razorpay test `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `apps/api/.env`.

4. **Schema & seed**

   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run API + web**

   ```bash
   npm run dev
   ```

   - Web: [http://localhost:3002](http://localhost:3002)
   - API: [http://localhost:4000/api/health](http://localhost:4000/api/health)

6. **After code changes (clean restart)** — stops **all** prior `concurrently` / `tsx watch` / `next dev` instances for this repo, frees **3002** (web) and **4000** (API), rebuilds `@merrakii/shared`, then starts both servers:

   ```bash
   npm run dev:restart
   ```

   Use this when you hit `EADDRINUSE`, duplicate `tsx watch` processes, a stuck Next.js `500`, or after API edits that did not hot-reload. **Only one** `npm run dev` (or `dev:restart`) should run at a time for this project.

## Auth (local)

- Request OTP, then verify. In **development**, OTP is always **`123456`** (or whatever you set as `DEV_OTP`). The API also returns a `devHint` after `/auth/otp/request`.
- Session is an **HTTP-only cookie** backed by the `ACTIVE_SESSIONS` table.

## Payments

1. Sign in → browse **Fields → Exams → Institutes → Apply**.
2. Submit the application form (documents are **deferred** per MVP).
3. On `/payment/[applicationId]`, **Pay with Razorpay** uses the Checkout script; the server verifies the signature via `POST /api/payments/confirm`.
4. Partner institutes: application status becomes **`ENROLLMENT_PENDING`**. Non-partner: **`LEAD_SENT`**.

## NPM scripts (root)

| Script        | Purpose                          |
|---------------|----------------------------------|
| `npm run dev` | API (4000) + Next (3002)         |
| `npm run db:push` | `prisma db push` (dev schema) |
| `npm run db:seed` | Seed fields, exams, institutes |
| `npm run db:migrate` | `prisma migrate dev`        |
| `npm run build`    | shared + api + web          |

## Folder structure

```
apps/api          Fastify API, Prisma schema & seed
apps/web          Next.js App Router UI
packages/shared   Zod schemas + shared constants
```

## Mandatory tables (implemented)

- `User` (UUID PK) — `USERS` concept
- `ActiveSession` — `ACTIVE_SESSIONS`
- `PaymentPlan` — `PAYMENT_PLANS`
- `PaymentDetail` — `PAYMENT_DETAILS`
- `Application` — `APPLICATIONS`

Plus catalog tables: `AcademicField`, `Exam`, `Institute`, `Program`.

## Digi deck & Executive Inputs (HTML + Excel)

- Static deck: [deliverable/digi.html](deliverable/digi.html) — go to the **Executive inputs** slide, answer per section, then **Submit to workbook (Excel)**.
- Workbook: [docs/Merrakii_Business_Capture.xlsx](docs/Merrakii_Business_Capture.xlsx) — one sheet per section (Company content, Brand and contact, …). Column **A** is the question, column **B** is a placeholder for answers. The first sheet, **Submission log**, stores **one row per section + question number**: each submit **updates** that row (timestamp and response) if it already exists, or **inserts** it once. Columns: `Timestamp (UTC)`, section, `Q#`, question text, response. **Note:** two different visitors editing the same question share one row (last submit wins). Regenerate the questionnaire structure (including the **Submission log** header) with:
  `python scripts/generate_merrakii_business_questionnaire.py` (openpyxl required).

**Why a separate service?** GitHub Pages only serves static files. It cannot run code or write to your repository. To store responses in [docs/Merrakii_Business_Capture.xlsx](docs/Merrakii_Business_Capture.xlsx) in GitHub, run [executive-inputs-server/app.py](executive-inputs-server/app.py) on a host you control, give it a **GitHub personal access token** (Contents: read/write on that repo) and repository metadata via environment variables, then set `window.EXEC_INPUTS_API_BASE` in [docs/executive-inputs-config.js](docs/executive-inputs-config.js) to the service’s public URL and commit. Never put the token in the browser; it stays on the server only.

**Deploy (example env for GitHub-backed storage)**

| Variable | Purpose |
|----------|---------|
| `EXECUTIVE_INPUTS_GITHUB_TOKEN` | Fine-grained or classic PAT with **Contents: Read and write** on this repository |
| `EXECUTIVE_INPUTS_GITHUB_REPO` | e.g. `tarun-rastogi/merrakii` |
| `EXECUTIVE_INPUTS_GITHUB_FILE` | Default `docs/Merrakii_Business_Capture.xlsx` |
| `EXECUTIVE_INPUTS_GITHUB_BRANCH` | Default `main` |
| `CORS_ALLOW_ORIGIN` | Your GitHub Pages origin, e.g. `https://tarun-rastogi.github.io` (or `*` for any origin) |
| `PORT` | HTTP port (e.g. Render sets this) |
| `EXECUTIVE_INPUTS_SUBMIT_TOKEN` | (Optional) if set, clients must pass the same value as `X-Submit-Token` and [docs/executive-inputs-config.js](docs/executive-inputs-config.js) `EXEC_INPUTS_SUBMIT_TOKEN` (only use if you are comfortable embedding that string in a public file) |

**Render (this repo is wired for it)**

1. Push these changes to `main` on GitHub.
2. In [Render](https://dashboard.render.com/): **New** → **Blueprint** → connect this repository → apply [render.yaml](render.yaml).
3. When prompted, create the **secret** `EXECUTIVE_INPUTS_GITHUB_TOKEN` (GitHub → Settings → Developer settings → [Fine-grained token](https://github.com/settings/tokens?type=beta): grant **Contents: Read and write** for this repository only, branch: `main`).
4. After deploy, open `https://merrakii-executive-capture.onrender.com/api/health` and confirm `github_capture.configured` is `true` (it stays `true` as long as the token is set; it is never exposed to the client).
5. The deck in [docs/executive-inputs-config.js](docs/executive-inputs-config.js) points at the same default hostname; if you rename the service in Render, change that one line to your `https://<name>.onrender.com` and push. If the GitHub repository owner/name is not `tarun-rastogi/merrakii`, update `EXECUTIVE_INPUTS_GITHUB_REPO` in the Render environment or in `render.yaml` before applying the Blueprint.

The capture API is served by a container built from [executive-inputs-server/Dockerfile](executive-inputs-server/Dockerfile) (build context: repository root). Local test: `docker build -f executive-inputs-server/Dockerfile -t merrakii-exec:local .` and run with the same environment variables.

**Local (disk only, no GitHub):**

  ```bash
  python3 -m venv .venv
  . .venv/bin/activate
  pip install -r executive-inputs-server/requirements.txt
  python executive-inputs-server/app.py
  ```

  Open [http://127.0.0.1:5050/deliverable/digi.html](http://127.0.0.1:5050/deliverable/digi.html) — same origin allows submit without `EXEC_INPUTS_API_BASE`. Writes upsert into the local `docs/Merrakii_Business_Capture.xlsx` Submission log.

**Public GitHub Pages** (`https://<user>.github.io/<repo>/deliverable/digi.html`): set `EXEC_INPUTS_API_BASE` in `docs/executive-inputs-config.js` to the deployed service URL, push, and wait for the Pages build.

## GitHub (host the repo)

**Canonical remote:** [github.com/tarun-rastogi/merrakii](https://github.com/tarun-rastogi/merrakii).

1. Create a new empty repository in your GitHub account (no README/license if you will push an existing history).
2. From this folder:

   ```bash
   git init
   git add -A
   git commit -m "Initial commit: Merrakii platform"
   git branch -M main
   git remote add origin https://github.com/<your-username>/merrakii.git
   git push -u origin main
   ```

3. **GitHub Pages** (required for `https://<user>.github.io/merrakii/...`):

   - Repo → **Settings** → **Pages** → **Build and deployment**.
   - **Source:** choose **GitHub Actions** (recommended). The workflow [.github/workflows/deploy-github-pages.yml](.github/workflows/deploy-github-pages.yml) publishes `deliverable/`, the executive-inputs scripts under `docs/`, and Helvetica fonts expected by `digi.html`. After the first successful run, open [https://tarun-rastogi.github.io/merrakii/deliverable/digi.html](https://tarun-rastogi.github.io/merrakii/deliverable/digi.html).
   - **If you use “Deploy from a branch” instead:** set branch **`main`** and folder **`/` (root)**. A root [`.nojekyll`](.nojekyll) is included so Jekyll does not strip static paths. Do **not** use **/docs** only—`digi.html` lives under **`deliverable/`** at repository root.
   - Renaming the repository **does not** turn Pages on automatically; you must set (or re-set) the source above once.

   To save submissions into **Merrakii_Business_Capture.xlsx**, deploy `executive-inputs-server` with the GitHub env vars above and set `EXEC_INPUTS_API_BASE` in `docs/executive-inputs-config.js` (see **Digi deck & Executive Inputs**).

## Production notes

- Move from `db push` to **`prisma migrate`** for versioned migrations.
- Add real SMS for OTP; never return OTP hints in production (see `apps/api/src/routes/auth.ts`).
- Configure Razorpay **webhooks** with raw-body signature verification for redundancy (client confirm is implemented for MVP).
