// Run in an isolated validation checkout with tsx and @electric-sql/pglite.
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import { ensureBrandRibbons, BRAND_CONTENT_KEY } from "../src/db/brand-migration";
import { INITIAL_BRANDS, INITIAL_BRAND_SECTIONS } from "../src/lib/brand-data";
import { ribbonBrands, ribbonSections } from "../src/lib/brand-ribbons";
import { BrandRibbon } from "../src/components/BrandRibbon";

function fixture() {
  const db = new PGlite();
  // PGlite is single-connection: this validates SQL/rollback, NOT multi-session locks.
  const pool = { connect: async () => ({
    query: async (sql: string, params?: unknown[]) => {
      if (!params && sql.includes(";")) { await db.exec(sql); return { rows: [] }; }
      return db.query(sql, params);
    }, release() {},
  }) } as unknown as Pool;
  return { db, pool };
}

test("empty database, content, idempotency and admin edits", async () => {
  const { db, pool } = fixture();
  try {
    await ensureBrandRibbons(pool);
    assert.equal((await db.query("SELECT * FROM brands")).rows.length, INITIAL_BRANDS.length);
    assert.equal((await db.query("SELECT * FROM sections WHERE is_active")).rows.length, 2);
    await db.exec("UPDATE brands SET name_en='Admin',is_active=false WHERE slug='hp'; DELETE FROM brands WHERE slug='canon'; UPDATE sections SET is_active=false WHERE slug='it-brands'");
    await ensureBrandRibbons(pool);
    assert.equal((await db.query<{ name_en: string }>("SELECT name_en FROM brands WHERE slug='hp'")).rows[0].name_en, "Admin");
    assert.equal((await db.query("SELECT * FROM brands WHERE slug='canon'")).rows.length, 0);
    assert.equal((await db.query("SELECT * FROM sections WHERE slug='it-brands' AND is_active")).rows.length, 0);
  } finally { await db.close(); }
});

test("legacy schema, missing group, duplicates, invalid sections", async () => {
  const { db, pool } = fixture();
  try {
    await db.exec(`CREATE TABLE brands(id serial primary key, slug text);
      INSERT INTO brands(slug) VALUES ('hp'),(' HP '),('obsolete');
      CREATE TABLE sections(id serial primary key, slug text);
      INSERT INTO sections(slug) VALUES ('legacy'),('legacy');`);
    await ensureBrandRibbons(pool);
    assert.equal((await db.query("SELECT * FROM brands WHERE slug='hp'")).rows.length, 1);
    assert.equal((await db.query("SELECT * FROM brands WHERE slug='obsolete'")).rows.length, 0);
    assert.equal((await db.query(`SELECT * FROM sections WHERE type='brands' AND is_active AND ("group" IS NULL OR "group" NOT IN ('it','stationery'))`)).rows.length, 0);
    await assert.rejects(db.query("INSERT INTO brands(slug) VALUES ('hp')"));
  } finally { await db.close(); }
});

test("failure rolls back content and marker; retry succeeds", async () => {
  const { db, pool } = fixture();
  try {
    await db.exec("CREATE TABLE brands(id serial primary key,slug text CHECK (slug <> 'canon'))");
    await assert.rejects(ensureBrandRibbons(pool));
    assert.equal((await db.query("SELECT * FROM brands")).rows.length, 0);
    assert.equal((await db.query<{ name: string | null }>("SELECT to_regclass('app_migrations') AS name")).rows[0].name, null);
    await db.exec("ALTER TABLE brands DROP CONSTRAINT brands_slug_check");
    await ensureBrandRibbons(pool);
    assert.equal((await db.query("SELECT * FROM app_migrations WHERE migration_key=$1", [BRAND_CONTENT_KEY])).rows.length, 1);
  } finally { await db.close(); }
});

test("active groups only, deduplication and Arabic/English accessible markup", () => {
  assert.equal(ribbonBrands([...INITIAL_BRANDS, INITIAL_BRANDS[0], { ...INITIAL_BRANDS[0], slug: 'inactive', isActive: false }], 'it').length, 6);
  assert.deepEqual(ribbonBrands(INITIAL_BRANDS, null), []);
  assert.equal(ribbonSections([...INITIAL_BRAND_SECTIONS, { ...INITIAL_BRAND_SECTIONS[0], group: null }]).length, 2);
  for (const lang of ['ar', 'en'] as const) {
    const html = renderToStaticMarkup(<BrandRibbon section={INITIAL_BRAND_SECTIONS[0]} brands={INITIAL_BRANDS} lang={lang} onSearch={() => {}} />);
    assert.match(html, /dir="ltr"/);
    assert.match(html, /class="brand-ribbon-window" dir="ltr"/);
    assert.doesNotMatch(html, /إتش بي/);
    assert.match(html, /aria-label="HP"/);
    assert.doesNotMatch(html, /<span/);
    assert.doesNotMatch(html, /<h[1-6][\s>]/);
    assert.match(html, /aria-hidden="true"/);
    assert.equal((html.match(/tabindex="0"/g) || []).length, 6);
    assert.equal((html.match(/tabindex="-1"/g) || []).length, 18);
    assert.match(html, lang === 'ar' ? /ماركات الحاسوب والطابعات/ : /Computing &amp; printer brands/);
  }
  assert.equal(renderToStaticMarkup(<BrandRibbon section={{ ...INITIAL_BRAND_SECTIONS[0], group: null }} brands={INITIAL_BRANDS} lang="en" onSearch={() => {}} />), '');
});

// Point only at a disposable PostgreSQL database. No production env is loaded.
test("simultaneous migrations on real PostgreSQL", { skip: !process.env.BRAND_TEST_DATABASE_URL }, async () => {
  const connectionString = process.env.BRAND_TEST_DATABASE_URL;
  const admin = new Pool({ connectionString });
  const schema = `brand_test_${Date.now()}`;
  const pool = new Pool({ connectionString, max: 4, options: `-c search_path=${schema}` });
  try {
    await admin.query(`CREATE SCHEMA ${schema}`);
    await Promise.all(Array.from({ length: 4 }, () => ensureBrandRibbons(pool)));
    assert.equal((await pool.query("SELECT * FROM brands")).rows.length, INITIAL_BRANDS.length);
    assert.equal((await pool.query("SELECT * FROM app_migrations WHERE migration_key=$1", [BRAND_CONTENT_KEY])).rows.length, 1);
    assert.equal((await pool.query(`SELECT * FROM sections WHERE is_active AND type='brands' AND ("group" IS NULL OR "group" NOT IN ('it','stationery'))`)).rows.length, 0);
  } finally {
    await pool.end();
    await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    await admin.end();
  }
});


test("short lists fill the track without adding keyboard stops", () => {
  for (const count of [1, 2, 6]) {
    const html = renderToStaticMarkup(<BrandRibbon section={INITIAL_BRAND_SECTIONS[0]} brands={INITIAL_BRANDS.slice(0, count)} lang="ar" onSearch={() => {}} />);
    const total = (html.match(/<button/g) || []).length;
    // The ribbon window is capped at the homepage content width (1440px).
    assert.ok(total / 2 * 172 >= 1440, "each half covers the maximum viewport");
    assert.equal((html.match(/tabindex="0"/g) || []).length, count);
  }
});
