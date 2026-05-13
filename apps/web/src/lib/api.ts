const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers,
      credentials: "include",
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    });
  } catch (e) {
    const hint =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ? ` Cannot reach ${base}. From the project root run "npm run dev" (API on port 4000). If you use http://127.0.0.1:3002, the API must be running with dev CORS (default).`
        : "";
    const msg = e instanceof Error ? e.message : "Network error";
    throw new Error(`${msg}.${hint}`);
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      res.ok ? "Invalid response from API (not JSON)." : `API error (${res.status}): ${text.slice(0, 160)}`,
    );
  }
  if (!res.ok) {
    const d = data as { error?: string; message?: string } | null;
    const fromFastifyGeneric =
      d?.error === "Internal Server Error" && d?.message
        ? String(d.message)
            .split("\n")
            .map((l) => l.trim())
            .find(Boolean)
            ?.slice(0, 220)
        : undefined;
    const err = new Error(fromFastifyGeneric ?? d?.error ?? d?.message ?? res.statusText);
    (err as Error & { status?: number; body?: unknown }).status = res.status;
    (err as Error & { body?: unknown }).body = data;
    throw err;
  }
  return data as T;
}
