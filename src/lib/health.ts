import { db } from "@/db";
import { sql } from "drizzle-orm";

/**
 * Never let a CDN/Vercel edge cache the probe.
 *
 * Without this header Vercel caches the JSON body for a bare URL, so a
 * `{"ok":false}` captured while the database was unreachable keeps being served
 * long after the database came back up (and vice versa).
 */
export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
} as const;

export interface HealthReport {
  ok: boolean;
  database: { configured: boolean; connected: boolean; latencyMs: number };
  error?: string;
}

/** Strip credentials before echoing any error text back to a caller. */
function sanitize(message: string): string {
  return message
    .replace(/\/\/[^@\s/]+@/g, "//***@")
    .replace(/password=[^\s&]+/gi, "password=***")
    .slice(0, 300);
}

/** Run the `select 1` probe and describe the outcome. Never throws. */
export async function probeDatabase(): Promise<{ report: HealthReport; status: number }> {
  const configured = Boolean(process.env.DATABASE_URL);
  const startedAt = Date.now();

  let failure: string | null = null;
  try {
    await db.execute(sql`select 1`);
  } catch (cause) {
    failure = cause instanceof Error ? cause.message : String(cause);
    console.error("Database health probe failed:", cause);
  }
  const latencyMs = Date.now() - startedAt;

  if (failure) {
    return {
      status: 503,
      report: {
        ok: false,
        database: { configured, connected: false, latencyMs },
        error: sanitize(failure),
      },
    };
  }

  return {
    status: 200,
    report: { ok: true, database: { configured, connected: true, latencyMs } },
  };
}

/** Build the probe response; the failure reason is only added when asked for. */
export function healthResponse(url: string): Promise<Response> {
  return probeDatabase().then(({ report, status }) => {
    const detail = new URL(url).searchParams.has("detail");
    const { error, ...safe } = report;
    return Response.json(detail && error ? { ...safe, error } : safe, {
      status,
      headers: NO_STORE_HEADERS,
    });
  });
}
