import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { normalizePhone } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderNumber = String(searchParams.get("orderNumber") || "")
    .trim()
    .toUpperCase();
  const customerPhone = normalizePhone(searchParams.get("phone") || "");

  if (!orderNumber || customerPhone.length < 8) {
    return NextResponse.json(
      { error: "Enter your order number and the phone used at checkout." },
      { status: 400 }
    );
  }

  try {
    await ensureDatabaseSeeded();
    const [order] = await db
      .select({
        orderNumber: orders.orderNumber,
        items: orders.items,
        total: orders.total,
        currency: orders.currency,
        status: orders.status,
        statusHistory: orders.statusHistory,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, orderNumber),
          eq(orders.customerPhoneNormalized, customerPhone)
        )
      )
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "We couldn't find an order with those details. Check the number and phone, then try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json(
      { error: "Order tracking is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }
}
