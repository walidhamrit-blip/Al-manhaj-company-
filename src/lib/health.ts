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

/**
 * The pool in `@/db` is configured with `connectionTimeoutMillis: 1000` so that
 * a build never hangs. That is too tight for a cold serverless start against a
 * pooled Neon endpoint: measured in production, the first probe of a cold
 * instance took 1012 ms and 1002 ms and failed, while the very next one took
 * 707 ms and succeeded. Two attempts with a roomier budget keep the probe
 * honest — it still reports a genuinely unreachable database — without crying
 * wolf on every cold start.
 */
const ATTEMPTS = 2;
const ATTEMPT_TIMEOUT_MS = 8000;

function runProbeOnce(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`probe timed out after ${ATTEMPT_TIMEOUT_MS}ms`)),
      ATTEMPT_TIMEOUT_MS
    );
    db.execute(sql`select 1`).then(
      () => {
        clearTimeout(timer);
        resolve();
      },
      (cause: unknown) => {
        clearTimeout(timer);
        reject(cause instanceof Error ? cause : new Error(String(cause)));
      }
    );
  });
}

/** Run the `select 1` probe and describe the outcome. Never throws. */
export async function probeDatabase(): Promise<{ report: HealthReport; status: number }> {
  const configured = Boolean(process.env.DATABASE_URL);
  const startedAt = Date.now();

  let failure: string | null = null;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      await runProbeOnce();
      failure = null;
      break;
    } catch (cause) {
      failure = cause instanceof Error ? cause.message : String(cause);
      console.error(`Database health probe failed (attempt ${attempt}/${ATTEMPTS}):`, cause);
    }
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
