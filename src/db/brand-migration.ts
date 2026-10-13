import type { Pool } from "pg";
import { INITIAL_BRANDS, INITIAL_BRAND_SECTIONS } from "../lib/brand-data";

// Content installation is independent of any global schema version.
export const BRAND_CONTENT_KEY = "brand-ribbons-content-v1";
export async function ensureBrandRibbons(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // All DDL, repairs and the content marker use the SAME connection/transaction.
    await client.query("SELECT pg_advisory_xact_lock(731024, 1)");
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (migration_key TEXT PRIMARY KEY, applied_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS brands (id SERIAL PRIMARY KEY);
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS name_en TEXT NOT NULL DEFAULT '';
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS name_ar TEXT NOT NULL DEFAULT '';
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS "group" TEXT;
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS logo_url TEXT NOT NULL DEFAULT '';
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS search_query TEXT NOT NULL DEFAULT '';
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE brands ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
      CREATE TABLE IF NOT EXISTS sections (id SERIAL PRIMARY KEY);
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS slug TEXT;
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'brands';
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS "group" TEXT;
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE sections ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
      LOCK TABLE brands, sections IN SHARE ROW EXCLUSIVE MODE;
      DELETE FROM brands a USING brands b WHERE lower(btrim(a.slug)) = lower(btrim(b.slug)) AND a.id < b.id;
      DELETE FROM sections a USING sections b WHERE lower(btrim(a.slug)) = lower(btrim(b.slug)) AND a.id < b.id;
      UPDATE brands SET slug = lower(btrim(slug)) WHERE slug IS DISTINCT FROM lower(btrim(slug));
      UPDATE sections SET slug = lower(btrim(slug)) WHERE slug IS DISTINCT FROM lower(btrim(slug));
      CREATE UNIQUE INDEX IF NOT EXISTS brands_slug_unique ON brands(slug);
      CREATE UNIQUE INDEX IF NOT EXISTS sections_slug_unique ON sections(slug);
      UPDATE sections SET is_active = false WHERE type = 'brands' AND ("group" IS NULL OR "group" NOT IN ('it', 'stationery'));
    `);
    const installed = await client.query("SELECT 1 FROM app_migrations WHERE migration_key = $1", [BRAND_CONTENT_KEY]);
    if (!installed.rows.length) {
      for (const brand of INITIAL_BRANDS) {
        // Existing names, activation and search settings belong to the admin.
        // Only a missing/invalid group is repaired on first installation.
        await client.query(`INSERT INTO brands (slug,name_en,name_ar,"group",logo_url,search_query,is_active,sort_order)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (slug) DO UPDATE
          SET "group" = CASE WHEN brands."group" IN ('it','stationery') THEN brands."group" ELSE EXCLUDED."group" END`,
        [brand.slug, brand.nameEn, brand.nameAr, brand.group, brand.logoUrl, brand.searchQuery, brand.isActive, brand.sortOrder]);
      }
      // Only the one-time curated-content installation removes obsolete brands,
      // and only AFTER all replacement upserts have succeeded.
      await client.query("DELETE FROM brands WHERE slug IS NULL OR NOT (slug = ANY($1::text[]))", [INITIAL_BRANDS.map(b => b.slug)]);
      for (const section of INITIAL_BRAND_SECTIONS) {
        await client.query(`INSERT INTO sections (slug,type,"group",is_active,sort_order) VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (slug) DO NOTHING`, [section.slug, section.type, section.group, section.isActive, section.sortOrder]);
      }
      await client.query("INSERT INTO app_migrations (migration_key) VALUES ($1)", [BRAND_CONTENT_KEY]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
