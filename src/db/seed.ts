import { db, pool } from "./index";
import {
  categories,
  products,
  storeSettings,
  type NewStoreSettings,
} from "./schema";
import { count, eq } from "drizzle-orm";
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_STORE_SETTINGS,
} from "@/lib/fallbackData";

export { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS };

const USD_TO_LYD = 5.5;
const EXPANDED_CATALOG_MIGRATION_KEY = "expanded-market-catalog-2026-10";
const EXPANDED_CATEGORY_SLUGS = new Set([
  "files-folders",
  "office-supplies",
  "school-essentials",
]);
const EXPANDED_PRODUCT_SKUS = new Set([
  "NB-A4BOX-04",
  "WR-HIGH-04",
  "BG-TROLLEY-04",
  "IT-SSD-04",
  "INK-DRUM-04",
  "ART-SET-04",
  "CALC-PRINT-04",
  "FL-ARCH-01",
  "FL-HANG-02",
  "FL-BOX-03",
  "OF-STAP-01",
  "OF-TAPE-02",
  "OF-NOTE-03",
  "OF-PUNCH-04",
  "SC-CASE-01",
  "SC-KIT-02",
  "SC-COVER-03",
]);

function toLyd(amount: number): number {
  return Math.round(amount * USD_TO_LYD * 100) / 100;
}

function toLydOrNull(amount: number | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  return toLyd(amount);
}

let isInitialized = false;

export async function ensureDatabaseSeeded() {
  if (isInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge_en TEXT NOT NULL DEFAULT 'Collection',
      badge_ar TEXT NOT NULL DEFAULT 'مجموعة',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      sku TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      title_en TEXT NOT NULL,
      title_ar TEXT NOT NULL,
      description_en TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      original_price DOUBLE PRECISION,
      wholesale_price DOUBLE PRECISION NOT NULL,
      wholesale_min_qty INTEGER NOT NULL DEFAULT 10,
      stock INTEGER NOT NULL DEFAULT 50,
      images JSONB NOT NULL,
      is_featured BOOLEAN NOT NULL DEFAULT false,
      is_promotion BOOLEAN NOT NULL DEFAULT false,
      is_hidden BOOLEAN NOT NULL DEFAULT false,
      specs_en TEXT NOT NULL DEFAULT '',
      specs_ar TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      store_name_en TEXT NOT NULL,
      store_name_ar TEXT NOT NULL,
      announcement_enabled BOOLEAN NOT NULL DEFAULT true,
      announcement_en TEXT NOT NULL DEFAULT '',
      announcement_ar TEXT NOT NULL DEFAULT '',
      announcement_short_en TEXT NOT NULL DEFAULT '',
      announcement_short_ar TEXT NOT NULL DEFAULT '',
      announcement_note_en TEXT NOT NULL DEFAULT '',
      announcement_note_ar TEXT NOT NULL DEFAULT '',
      header_tagline_en TEXT NOT NULL DEFAULT '',
      header_tagline_ar TEXT NOT NULL DEFAULT '',
      storefront_image TEXT NOT NULL DEFAULT '/images/new/main-storefront-hq.jpg',
      storefront_badge_en TEXT NOT NULL DEFAULT '',
      storefront_badge_ar TEXT NOT NULL DEFAULT '',
      storefront_title_en TEXT NOT NULL DEFAULT '',
      storefront_title_ar TEXT NOT NULL DEFAULT '',
      storefront_subtitle_en TEXT NOT NULL DEFAULT '',
      storefront_subtitle_ar TEXT NOT NULL DEFAULT '',
      storefront_description_en TEXT NOT NULL DEFAULT '',
      storefront_description_ar TEXT NOT NULL DEFAULT '',
      tagline_en TEXT NOT NULL,
      tagline_ar TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      address_en TEXT NOT NULL,
      address_ar TEXT NOT NULL,
      working_hours_en TEXT NOT NULL,
      working_hours_ar TEXT NOT NULL,
      currency_en TEXT NOT NULL DEFAULT 'LYD',
      currency_ar TEXT NOT NULL DEFAULT 'د.ل',
      wholesale_discount_tier1_pct INTEGER NOT NULL DEFAULT 15,
      wholesale_discount_tier2_pct INTEGER NOT NULL DEFAULT 22,
      wholesale_discount_tier3_pct INTEGER NOT NULL DEFAULT 30,
      wholesale_conditions_en TEXT NOT NULL,
      wholesale_conditions_ar TEXT NOT NULL,
      hero_slides JSONB NOT NULL,
      landscape_banner JSONB NOT NULL,
      default_theme TEXT NOT NULL DEFAULT 'atelier'
    );

    CREATE TABLE IF NOT EXISTS uploaded_images (
      id SERIAL PRIMARY KEY,
      original_name TEXT NOT NULL DEFAULT 'image',
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_phone_normalized TEXT NOT NULL,
      customer_notes TEXT NOT NULL DEFAULT '',
      items JSONB NOT NULL,
      total DOUBLE PRECISION NOT NULL,
      currency TEXT NOT NULL DEFAULT 'LYD',
      status TEXT NOT NULL DEFAULT 'pending',
      status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);
    CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders (customer_phone_normalized);

    CREATE TABLE IF NOT EXISTS app_migrations (
      migration_key TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Migration: add is_hidden column if not exists (for existing DBs)
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;`);

  // Migration: add parent_slug to categories for subcategory support
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_slug TEXT;`);

  // Migration: add subcategory_slug to products
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;`);

  // Migration: editable homepage content (banner, texts & storefront photo)
  await pool.query(`
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_short_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_short_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_note_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS announcement_note_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS header_tagline_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS header_tagline_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_image TEXT NOT NULL DEFAULT '/images/new/main-storefront-hq.jpg';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_badge_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_badge_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_title_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_title_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_subtitle_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_subtitle_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_description_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS storefront_description_ar TEXT NOT NULL DEFAULT '';
  `);

  // Migration: editable legal footer bar (commercial registry, Mawthooq, payments)
  await pool.query(`
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS compliance_enabled BOOLEAN NOT NULL DEFAULT true;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS compliance_status_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS compliance_status_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS commercial_registry TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS mawthooq_license TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS payment_notice_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS payment_notice_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS copyright_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS copyright_ar TEXT NOT NULL DEFAULT '';
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS payment_providers_url TEXT NOT NULL DEFAULT 'https://cbl.gov.ly/electronic-payment/';
  `);

  const [{ value: catCount }] = await db.select({ value: count() }).from(categories);
  if (catCount === 0) {
    await db.insert(categories).values(INITIAL_CATEGORIES);
  } else {
    // Ensure subcategories are seeded (they may not exist if the DB was created before subcategory support)
    const subcategories = INITIAL_CATEGORIES.filter(c => c.parentSlug);
    for (const sub of subcategories) {
      const existing = await db.select().from(categories).where(eq(categories.slug, sub.slug!)).limit(1);
      if (existing.length === 0) {
        await db.insert(categories).values(sub);
      }
    }
    // Upgrade category illustrative images to new high-quality (migrate old Pexels/cat-*.jpg)
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/notebooks.webp' WHERE slug='notebooks'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/writing.webp' WHERE slug='writing'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/bags.webp' WHERE slug='bags'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/it-accessories.webp' WHERE slug='it-peripherals'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/ink-toner.webp' WHERE slug='ink-consumables'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/art-drafting.webp' WHERE slug='art-drafting'`);
    await pool.query(`UPDATE categories SET image_url='/images/category-illustrations/calculators.webp' WHERE slug='calculators-tech'`);
  }

  const [{ value: prodCount }] = await db.select({ value: count() }).from(products);
  if (prodCount === 0) {
    await db.insert(products).values(
      INITIAL_PRODUCTS.map((product) => ({
        ...product,
        price: toLyd(product.price),
        originalPrice: toLydOrNull(product.originalPrice),
        wholesalePrice: toLyd(product.wholesalePrice),
      }))
    );
  } else {
    // Backfill subcategorySlug on existing products
    for (const product of INITIAL_PRODUCTS) {
      if (product.subcategorySlug) {
        await pool.query(
          `UPDATE products SET subcategory_slug = $1 WHERE sku = $2 AND (subcategory_slug IS NULL OR subcategory_slug = '')`,
          [product.subcategorySlug, product.sku]
        );
      }
    }
  }

  const existingSettings = await db.select().from(storeSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(storeSettings).values(INITIAL_STORE_SETTINGS);
  } else {
    const current = existingSettings[0];
    if (current.currencyEn !== "LYD") {
      await pool.query(`
        UPDATE products SET
          price = ROUND((price * 5.5)::numeric, 2),
          original_price = CASE
            WHEN original_price IS NULL THEN NULL
            ELSE ROUND((original_price * 5.5)::numeric, 2)
          END,
          wholesale_price = ROUND((wholesale_price * 5.5)::numeric, 2)
      `);
    }
    // Backfill ONLY the columns that are still empty: the homepage content is
    // now managed from the admin panel, so admin edits must never be reset by
    // a redeploy / cold start.
    const defaults = INITIAL_STORE_SETTINGS as unknown as Record<string, unknown>;
    const currentRow = current as unknown as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(defaults)) {
      const existingValue = currentRow[key];
      if (existingValue === null || existingValue === undefined || existingValue === "") {
        patch[key] = value;
      }
    }
    if (Object.keys(patch).length > 0) {
      await db
        .update(storeSettings)
        .set(patch as NewStoreSettings)
        .where(eq(storeSettings.id, current.id));
    }
  }

  // One-time expansion for databases that were seeded before the marketplace
  // catalog additions. The marker prevents deleted products from being silently
  // re-added on later cold starts.
  const catalogMigration = await pool.query(
    "SELECT migration_key FROM app_migrations WHERE migration_key = $1 LIMIT 1",
    [EXPANDED_CATALOG_MIGRATION_KEY]
  );
  if (catalogMigration.rows.length === 0) {
    const existingCategoryRows = await db
      .select({ slug: categories.slug })
      .from(categories);
    const existingCategorySlugs = new Set(
      existingCategoryRows.map((category) => category.slug)
    );
    const expandedCategories = INITIAL_CATEGORIES.filter(
      (category) =>
        EXPANDED_CATEGORY_SLUGS.has(category.slug) &&
        !existingCategorySlugs.has(category.slug)
    );
    if (expandedCategories.length > 0) {
      await db.insert(categories).values(expandedCategories).onConflictDoNothing();
    }

    const existingProductRows = await db
      .select({ sku: products.sku })
      .from(products);
    const existingProductSkus = new Set(
      existingProductRows.map((product) => product.sku)
    );
    const expandedProducts = INITIAL_PRODUCTS.filter(
      (product) =>
        EXPANDED_PRODUCT_SKUS.has(product.sku) &&
        !existingProductSkus.has(product.sku)
    );
    if (expandedProducts.length > 0) {
      await db.insert(products).values(
        expandedProducts.map((product) => ({
          ...product,
          price: toLyd(product.price),
          originalPrice: toLydOrNull(product.originalPrice),
          wholesalePrice: toLyd(product.wholesalePrice),
        }))
      );
    }

    await pool.query(
      "INSERT INTO app_migrations (migration_key) VALUES ($1) ON CONFLICT DO NOTHING",
      [EXPANDED_CATALOG_MIGRATION_KEY]
    );
  }

  isInitialized = true;
}
