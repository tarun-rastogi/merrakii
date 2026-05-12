#!/usr/bin/env node
/**
 * Remove the Vercel login wall (Deployment Protection) so visitors open your site directly.
 *
 * Create a token: https://vercel.com/account/tokens (scopes: sufficient to update projects).
 *
 *   export VERCEL_TOKEN=xxxxxxxx
 *   export VERCEL_PROJECT=my-project-name
 * Under a team, set ONE of:
 *   export VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxxxxx
 *   export VERCEL_TEAM_SLUG=my-team-slug
 *
 *   npm run vercel:disable-deployment-protection
 *
 * If this still prompts for login: check Team Settings → Security for a team default that
 * forces protection, or disable protection manually:
 * Project → Settings → Deployment Protection → Vercel Authentication / Password → Off (or narrower scope).
 */
const token = process.env.VERCEL_TOKEN;
const project = process.env.VERCEL_PROJECT;
const teamId = process.env.VERCEL_TEAM_ID;
const teamSlug = process.env.VERCEL_TEAM_SLUG;

if (!token || !project) {
  console.error(
    "Set VERCEL_TOKEN and VERCEL_PROJECT (name from Vercel → Project → Settings → General).\n",
  );
  process.exit(1);
}

if (teamId && teamSlug) {
  console.error("Use only one of VERCEL_TEAM_ID or VERCEL_TEAM_SLUG.\n");
  process.exit(1);
}

function q() {
  const p = new URLSearchParams();
  if (teamId) p.set("teamId", teamId);
  if (teamSlug) p.set("slug", teamSlug);
  const s = p.toString();
  return s ? `?${s}` : "";
}

const baseUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}${q()}`;

const getRes = await fetch(baseUrl, {
  headers: { Authorization: `Bearer ${token}` },
});
const getBody = await getRes.text();

if (!getRes.ok) {
  console.error(`Could not read project (${getRes.status}). ${getBody.slice(0, 1500)}`);
  process.exit(1);
}

let before;
try {
  before = JSON.parse(getBody);
} catch {
  before = {};
}

console.error(
  "Current protection:",
  JSON.stringify(
    {
      ssoProtection: before.ssoProtection ?? null,
      passwordProtection: before.passwordProtection ?? null,
      trustedIps: before.trustedIps ?? null,
    },
    null,
    2,
  ),
);

/** Null clears SSO, password, and IP allowlists so anonymous requests are not intercepted. */
const patchRes = await fetch(baseUrl, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ssoProtection: null,
    passwordProtection: null,
    trustedIps: null,
  }),
});

const text = await patchRes.text();
if (!patchRes.ok) {
  console.error(`Vercel API PATCH ${patchRes.status}: ${text.slice(0, 2500)}`);
  console.error(
    "\nIf you see forbidden or insufficient scope: use an account/token that can edit this project,\n",
    "or open the dashboard → Project Settings → Deployment Protection and turn protection off manually.\n",
  );
  process.exit(1);
}

let name = project;
try {
  name = JSON.parse(text).name ?? project;
} catch {
  /* ignore */
}
console.log(
  `Updated project "${name}": cleared ssoProtection, passwordProtection, and trustedIps.\n` +
    `Open your URL again in a private window.`,
);
