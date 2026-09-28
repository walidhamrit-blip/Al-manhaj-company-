import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Pour le build statique sur Cloudflare Pages sans base de données
// On utilise une URL dummy si DATABASE_URL n'est pas définie
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/dummy_build";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
    // Ne pas tenter de connecter pendant le build
    connectionTimeoutMillis: 1000,
    idleTimeoutMillis: 1000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
