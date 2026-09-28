import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, products, storeSettings } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();

    const [allCategories, allProducts, allSettings] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(products).orderBy(desc(products.isFeatured), asc(products.id)),
      db.select().from(storeSettings).limit(1),
    ]);

    return NextResponse.json({
      categories: allCategories,
      products: allProducts,
      settings: allSettings[0] ?? null,
    });
  } catch (error) {
    console.error("Error loading store data, returning seed fallback:", error);
    try {
      const { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_STORE_SETTINGS } = await import("@/lib/fallbackData");
      return NextResponse.json({
        categories: INITIAL_CATEGORIES,
        products: INITIAL_PRODUCTS,
        settings: INITIAL_STORE_SETTINGS,
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to load store data" },
        { status: 500 }
      );
    }
  }
}
