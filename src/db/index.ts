import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Le projet est déployé sur Vercel (Next.js + Neon). Sans DATABASE_URL, on garde
// une URL factice pour que `next build` puisse s'achever hors base, mais le
// avertissement ci-dessous rend ce cas immédiatement visible dans les journaux.
const databaseUrl =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/dummy_build";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set for this environment: /api/store silently falls " +
      "back to the seed catalog and the admin panel cannot save. On Vercel, set the " +
      "variable for Production *and* Preview (Settings > Environment Variables)."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Ceiling for *acquiring* a client, not a wait: with a healthy pooler this
    // returns in milliseconds. It used to be 1000 ms, which a Vercel cold start
    // can exceed just to open + TLS-connect to Neon — the query then failed and
    // /api/store quietly served the seed catalog instead of the real one. Kept
    // under the 10 s Hobby function budget so a timeout still surfaces as an
    // error rather than a silent fallback. `next build` only *creates* this Pool
    // (pg never connects eagerly), so a generous ceiling cannot hang the build.
    connectionTimeoutMillis: 8000,
    // Left deliberately short: on serverless, instances are frozen between
    // requests and each one holds its own connection. Releasing idle clients
    // quickly keeps the Neon pooler from exhausting its connection budget.
    idleTimeoutMillis: 1000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
