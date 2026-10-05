import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, type OrderStatus, type OrderStatusEvent } from "@/db/schema";
import { ensureDatabaseSeeded } from "@/db/seed";
import { isValidAdminToken } from "@/lib/admin-auth";
import { ORDER_STATUSES } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isValidAdminToken(request.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDatabaseSeeded();
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const body = await request.json();
    const nextStatus = String(body.status || "") as OrderStatus;
    if (!ORDER_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const [existingOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existingOrder.status === nextStatus) {
      return NextResponse.json({ order: existingOrder });
    }

    const updatedAt = new Date();
    const history: OrderStatusEvent[] = Array.isArray(existingOrder.statusHistory)
      ? existingOrder.statusHistory
      : [];
    history.push({ status: nextStatus, at: updatedAt.toISOString() });

    const [updatedOrder] = await db
      .update(orders)
      .set({ status: nextStatus, statusHistory: history, updatedAt })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
