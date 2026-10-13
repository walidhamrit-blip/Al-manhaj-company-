import { INITIAL_BRANDS, INITIAL_BRAND_SECTIONS } from "@/lib/brand-data";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products, storeSettings, brands, sections } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { hydrateFallbackStore } from "@/lib/fallbackData";
import { asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    const [allCategories, allProducts, allSettings, allBrands, allSections] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(products).orderBy(desc(products.isFeatured), asc(products.id)),
      db.select().from(storeSettings).limit(1),
      db.select().from(brands).orderBy(asc(brands.sortOrder)),
      db.select().from(sections).orderBy(asc(sections.sortOrder)),
    ]);

    return NextResponse.json({
      brands: allBrands,
      sections: allSections,
      categories: allCategories,
      products: allProducts,
      settings: allSettings[0] ?? null,
    });
  } catch (error) {
    console.error("Error loading store data, returning seed fallback:", error);
    try {
      return NextResponse.json({ ...hydrateFallbackStore(), brands: INITIAL_BRANDS, sections: INITIAL_BRAND_SECTIONS });
    } catch {
      return NextResponse.json(
        { error: "Failed to load store data" },
        { status: 500 }
      );
    }
  }
}
