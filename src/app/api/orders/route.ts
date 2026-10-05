import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { orders, products, type OrderLineItem, type OrderStatusEvent } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { isValidAdminToken } from "@/lib/admin-auth";
import { normalizePhone } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isValidAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSeeded();
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(300);

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDatabaseSeeded();
    const body = await request.json();
    const customerName = String(body.customerName || "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const customerPhone = String(body.customerPhone || "").trim();
    const customerPhoneNormalized = normalizePhone(customerPhone);
    const customerNotes = String(body.customerNotes || "")
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
      .trim()
      .slice(0, 500);

    if (customerName.length < 2 || customerName.length > 120) {
      return NextResponse.json(
        { error: "Please enter a name between 2 and 120 characters." },
        { status: 400 }
      );
    }

    if (customerPhoneNormalized.length < 8 || customerPhoneNormalized.length > 18) {
      return NextResponse.json(
        { error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
      return NextResponse.json(
        { error: "Your cart is empty or contains too many different items." },
        { status: 400 }
      );
    }

    const quantities = new Map<number, number>();
    for (const line of body.items) {
      const productId = Number(line?.productId);
      const quantity = Number(line?.quantity);
      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > 5000
      ) {
        return NextResponse.json(
          { error: "One of the requested quantities is invalid." },
          { status: 400 }
        );
      }
      const combinedQuantity = (quantities.get(productId) || 0) + quantity;
      if (combinedQuantity > 5000) {
        return NextResponse.json(
          { error: "A quantity is higher than the allowed limit." },
          { status: 400 }
        );
      }
      quantities.set(productId, combinedQuantity);
    }

    const requestedIds = [...quantities.keys()];
    const liveProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, requestedIds));

    if (
      liveProducts.length !== requestedIds.length ||
      liveProducts.some((product) => product.isHidden)
    ) {
      return NextResponse.json(
        { error: "One or more products are no longer available. Refresh the store and try again." },
        { status: 409 }
      );
    }

    const orderItems: OrderLineItem[] = liveProducts.map((product) => {
      const quantity = quantities.get(product.id) || 0;
      const unitPrice =
        quantity >= product.wholesaleMinQty
          ? Number(product.wholesalePrice)
          : Number(product.price);
      const lineTotal = Math.round(unitPrice * quantity * 100) / 100;
      const images = Array.isArray(product.images) ? product.images : [];

      return {
        productId: product.id,
        sku: product.sku,
        titleEn: product.titleEn,
        titleAr: product.titleAr,
        imageUrl: images[0] || "/images/new/main-storefront-hq.jpg",
        quantity,
        unitPrice,
        lineTotal,
      };
    });

    const total = Math.round(
      orderItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100
    ) / 100;
    const createdAt = new Date();
    const statusHistory: OrderStatusEvent[] = [
      { status: "pending", at: createdAt.toISOString() },
    ];
    const orderNumber = `AM-${createdAt.getFullYear()}-${randomBytes(8)
      .toString("hex")
      .toUpperCase()}`;

    const [createdOrder] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerName,
        customerPhone,
        customerPhoneNormalized,
        customerNotes,
        items: orderItems,
        total,
        status: "pending",
        statusHistory,
        createdAt,
        updatedAt: createdAt,
      })
      .returning();

    return NextResponse.json({ order: createdOrder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "We could not save your order for tracking. Please try again." },
      { status: 500 }
    );
  }
}
