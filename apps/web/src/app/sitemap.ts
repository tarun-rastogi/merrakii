import type { MetadataRoute } from "next";

/**
 * Public URLs suitable for search indexing.
 * Authenticated / transactional routes (/account, /apply/*, /payment/*) are omitted by default.
 *
 * Set NEXT_PUBLIC_SITE_URL to your canonical origin (e.g. https://merrakii.co.in).
 */
function canonicalBase(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    return `https://${host}`;
  }
  return "https://merrakii.co.in";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = canonicalBase();

  const paths = [
    { path: "", priority: 1, changeFrequency: "weekly" as const },
    { path: "/abroad", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/india", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/search", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/catalog", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/exams", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/fields", priority: 0.85, changeFrequency: "weekly" as const },
  ];

  const now = new Date();

  return paths.map(({ path, priority, changeFrequency }) => ({
    url: path === "" ? `${base}/` : `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
