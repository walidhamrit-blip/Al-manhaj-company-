import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Never let a CDN/Vercel edge cache this probe.
 *
 * Without this header Vercel caches the JSON body for the bare URL, so a
 * `{"ok":false}` captured while the database was unreachable keeps being served
 * long after the database came back up (and vice versa). A query string
 * bypasses the cache, which is why `/api/health?x=1` can disagree with
 * `/api/health`.
 */
const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" } as const;

/** Strip credentials before echoing any error text back to the caller. */
function sanitize(message: string): string {
  return message
    .replace(/\/\/[^@\s/]+@/g, "//***@")
    .replace(/password=[^\s&]+/gi, "password=***")
    .slice(0, 300);
}

export async function GET(request: Request) {
  const detail = new URL(request.url).searchParams.has("detail");
  const configured = Boolean(process.env.DATABASE_URL);

  const startedAt = Date.now();
  let error: string | null = null;
  try {
    await db.execute(sql`select 1`);
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
    console.error("GET /api/health database probe failed:", cause);
  }
  const latencyMs = Date.now() - startedAt;

  if (error) {
    return Response.json(
      {
        ok: false,
        database: { configured, connected: false, latencyMs },
        // Only exposed on explicit request so the endpoint stays safe to poll.
        ...(detail ? { error: sanitize(error) } : null),
      },
      { status: 503, headers: NO_STORE }
    );
  }

  return Response.json(
    { ok: true, database: { configured, connected: true, latencyMs } },
    { status: 200, headers: NO_STORE }
  );
}
