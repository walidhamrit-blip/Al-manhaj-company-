import { NO_STORE_HEADERS } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * The database probe now lives at `/api/health/live`.
 *
 * This route used to answer directly, without a `Cache-Control` header, so
 * Vercel cached its JSON body for the bare URL. One `{"ok":false}` recorded
 * during a database blip is still being replayed from the edge cache after the
 * fix shipped — and `no-store` only governs new responses, it cannot evict an
 * entry that is already stored.
 *
 * Redirecting moves the probe to a URL that has never been cached. The redirect
 * itself is sent with `no-store` so it is not cached either, which keeps this
 * route reversible: once the stale entry is gone, it can answer directly again.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Relative Location: resolved against the caller's origin, so this stays
  // correct behind a proxy (an absolute URL would be built from the address
  // the server is bound to, e.g. http://0.0.0.0:3000/...).
  const location = `/api/health/live${url.search}`; // carry ?detail across

  return new Response(null, {
    status: 302,
    headers: { ...NO_STORE_HEADERS, Location: location },
  });
}
