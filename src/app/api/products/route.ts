import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { asc, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureDatabaseSeeded();
    const allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.isFeatured), asc(products.id));
    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("GET /api/products error, seed fallback:", error);
    try {
      const { hydrateFallbackStore } = await import("@/lib/fallbackData");
      return NextResponse.json({ products: hydrateFallbackStore().products });
    } catch {
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await request.json();

    const imagesArray: string[] = Array.isArray(body.images)
      ? body.images.filter((url: string) => typeof url === "string" && url.trim().length > 0)
      : [];

    if (imagesArray.length === 0) {
      imagesArray.push("/images/hero-stationery.jpg");
    }

    const [created] = await db
      .insert(products)
      .values({
        sku: String(body.sku || `SKU-${Date.now().toString().slice(-4)}`),
        categorySlug: String(body.categorySlug || "notebooks"),
        titleEn: String(body.titleEn || "New Product"),
        titleAr: String(body.titleAr || "منتج جديد"),
        descriptionEn: String(body.descriptionEn || ""),
        descriptionAr: String(body.descriptionAr || ""),
        price: Number(body.price) || 10,
        originalPrice:
          body.originalPrice !== null &&
          body.originalPrice !== undefined &&
          body.originalPrice !== ""
            ? Number(body.originalPrice)
            : null,
        wholesalePrice: Number(body.wholesalePrice) || Number(body.price) * 0.75 || 7.5,
        wholesaleMinQty: Number(body.wholesaleMinQty) || 10,
        stock: Number(body.stock ?? 50),
        images: imagesArray,
        isFeatured: Boolean(body.isFeatured),
        isPromotion: Boolean(body.isPromotion),
        isHidden: Boolean(body.isHidden),
        specsEn: String(body.specsEn || ""),
        specsAr: String(body.specsAr || ""),
      })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
