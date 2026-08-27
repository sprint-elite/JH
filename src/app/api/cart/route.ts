import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchCartForUser } from "@/lib/cart";

export async function GET() {
  try {
    const user = await requireUser();
    const cart = await fetchCartForUser(user.id);
    return NextResponse.json({ cart });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      productSlug?: string;
      quantity?: number;
    };
    const productSlug = body.productSlug?.trim();
    if (!productSlug) return jsonError("상품을 선택해 주세요.", 400);

    const product = await prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
    });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);
    if (product.saleType !== "READYMADE") {
      return jsonError("기성품만 장바구니에 담을 수 있습니다.", 400);
    }

    const addQty = Math.round(Number(body.quantity) || product.minQuantity);
    if (addQty < 1) return jsonError("수량이 올바르지 않습니다.", 400);

    const existing = await prisma.cartItem.findUnique({
      where: {
        userId_productId: { userId: user.id, productId: product.id },
      },
    });

    const nextQty = Math.min(
      product.maxQuantity,
      (existing?.quantity ?? 0) + addQty,
    );
    if (nextQty < product.minQuantity) {
      return jsonError(`최소 주문 수량은 ${product.minQuantity}개입니다.`, 400);
    }

    await prisma.cartItem.upsert({
      where: {
        userId_productId: { userId: user.id, productId: product.id },
      },
      create: {
        userId: user.id,
        productId: product.id,
        quantity: nextQty,
      },
      update: { quantity: nextQty },
    });

    const cart = await fetchCartForUser(user.id);
    return NextResponse.json({ cart }, { status: existing ? 200 : 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
