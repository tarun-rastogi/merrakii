#!/usr/bin/env node
/**
 * Clears Vercel Authentication / password Deployment Protection via the Projects API so
 * deployment URLs can be opened without signing in (when SSO was the only barrier).
 *
 * Create a token: https://vercel.com/account/tokens
 *
 *   export VERCEL_TOKEN=xxxxxxxx
 *   export VERCEL_PROJECT=my-project-name
 * Optional (team-owned project):
 *   export VERCEL_TEAM_ID=team_xxxxxxxxxxxxxxxxxxxxxxxx
 *
 *   node scripts/disable-vercel-deployment-protection.mjs
 */
const token = process.env.VERCEL_TOKEN;
const project = process.env.VERCEL_PROJECT;
const teamId = process.env.VERCEL_TEAM_ID;

if (!token || !project) {
  console.error(
    "Missing env: VERCEL_TOKEN and VERCEL_PROJECT (project name under Settings → General).\n",
  );
  process.exit(1);
}

const q = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}${q}`;

const res = await fetch(url, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    ssoProtection: null,
    passwordProtection: null,
  }),
});

const text = await res.text();
if (!res.ok) {
  console.error(`Vercel API ${res.status}: ${text.slice(0, 2000)}`);
  process.exit(1);
}

let name = project;
try {
  name = JSON.parse(text).name ?? project;
} catch {
  /* ignore */
}
console.log(`Deployment protection cleared for project "${name}" (ssoProtection + passwordProtection).`);
