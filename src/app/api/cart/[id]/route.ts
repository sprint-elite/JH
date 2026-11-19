import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchCartForUser } from "@/lib/cart";
import { assertStockAvailable } from "@/lib/inventory";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as { quantity?: number };
    const quantity = Math.round(Number(body.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      return jsonError("수량이 올바르지 않습니다.", 400);
    }

    const item = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
      include: { product: true },
    });
    if (!item) return jsonError("장바구니 항목을 찾을 수 없습니다.", 404);

    const qty = Math.min(
      item.product.maxQuantity,
      Math.max(item.product.minQuantity, quantity),
    );
    const stockErr = assertStockAvailable(
      item.product.stockQuantity,
      qty,
      item.product.name,
    );
    if (stockErr) return jsonError(stockErr, 400);

    await prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: qty },
    });

    return NextResponse.json({ cart: await fetchCartForUser(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const item = await prisma.cartItem.findFirst({
      where: { id, userId: user.id },
    });
    if (!item) return jsonError("장바구니 항목을 찾을 수 없습니다.", 404);

    await prisma.cartItem.delete({ where: { id: item.id } });
    return NextResponse.json({ cart: await fetchCartForUser(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
