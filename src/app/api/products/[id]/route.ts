import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const body = await request.json();

    const imagesArray: string[] = Array.isArray(body.images)
      ? body.images.filter((url: string) => typeof url === "string" && url.trim().length > 0)
      : ["/images/hero-stationery.jpg"];

    const [updated] = await db
      .update(products)
      .set({
        sku: String(body.sku ?? "SKU-001"),
        categorySlug: String(body.categorySlug ?? "notebooks"),
        titleEn: String(body.titleEn ?? ""),
        titleAr: String(body.titleAr ?? ""),
        descriptionEn: String(body.descriptionEn ?? ""),
        descriptionAr: String(body.descriptionAr ?? ""),
        price: Number(body.price ?? 0),
        originalPrice:
          body.originalPrice !== null &&
          body.originalPrice !== undefined &&
          body.originalPrice !== "" &&
          Number(body.originalPrice) > 0
            ? Number(body.originalPrice)
            : null,
        wholesalePrice: Number(body.wholesalePrice ?? 0),
        wholesaleMinQty: Number(body.wholesaleMinQty ?? 10),
        stock: Number(body.stock ?? 0),
        images: imagesArray.length > 0 ? imagesArray : ["/images/hero-stationery.jpg"],
        isFeatured: Boolean(body.isFeatured),
        isPromotion: Boolean(body.isPromotion),
        isHidden: Boolean(body.isHidden),
        specsEn: String(body.specsEn ?? ""),
        specsAr: String(body.specsAr ?? ""),
      })
      .where(eq(products.id, productId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDatabaseSeeded();
    const { id } = await context.params;
    const productId = Number(id);
    if (Number.isNaN(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    await db.delete(products).where(eq(products.id, productId));
    return NextResponse.json({ deleted: true, id: productId });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
