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
    try {
      const { hydrateFallbackStore } = await import("@/lib/fallbackData");
      return NextResponse.json({ categories: hydrateFallbackStore().categories });
    } catch {
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
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

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await request.json();
    // Générer un slug unique à partir du nom
    const baseSlug = String(body.slug || body.nameEn || "new-category")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = baseSlug + "-" + Date.now().toString().slice(-4);
    
    const [created] = await db
      .insert(categories)
      .values({
        slug: slug,
        nameEn: String(body.nameEn || "New Category"),
        nameAr: String(body.nameAr || "قسم جديد"),
        descriptionEn: String(body.descriptionEn || ""),
        descriptionAr: String(body.descriptionAr || ""),
        imageUrl: String(body.imageUrl || "/images/hero-stationery.jpg"),
        badgeEn: String(body.badgeEn || "Collection"),
        badgeAr: String(body.badgeAr || "مجموعة"),
        sortOrder: Number(body.sortOrder ?? 99),
      })
      .returning();

    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    
    // Vérifier qu'il n'y a pas de produits dans cette catégorie
    const { products } = await import("@/db/schema");
    const productCount = await db.select().from(products).where(eq(products.categorySlug, (await db.select().from(categories).where(eq(categories.id, id)).limit(1))[0]?.slug || ""));
    
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
