import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id));
    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    try { const { INITIAL_CATEGORIES } = await import("@/lib/fallbackData"); return NextResponse.json({ categories: INITIAL_CATEGORIES }); } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }); }
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await request.json();
    const catId = Number(body.id);
    if (!catId) {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const [updated] = await db
      .update(categories)
      .set({
        nameEn: String(body.nameEn ?? ""),
        nameAr: String(body.nameAr ?? ""),
        descriptionEn: String(body.descriptionEn ?? ""),
        descriptionAr: String(body.descriptionAr ?? ""),
        imageUrl: String(body.imageUrl ?? "/images/hero-stationery.jpg"),
        badgeEn: String(body.badgeEn ?? "Collection"),
        badgeAr: String(body.badgeAr ?? "مجموعة"),
        sortOrder: Number(body.sortOrder ?? 1),
      })
      .where(eq(categories.id, catId))
      .returning();

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}
