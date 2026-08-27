import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchWishlist } from "@/lib/wishlist";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await fetchWishlist(user.id);
    return NextResponse.json({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { productId?: string; productSlug?: string };
    let productId = body.productId?.trim();
    if (!productId && body.productSlug) {
      const p = await prisma.product.findFirst({
        where: { slug: body.productSlug.trim(), isActive: true },
        select: { id: true },
      });
      productId = p?.id;
    }
    if (!productId) return jsonError("상품을 선택해 주세요.", 400);

    const product = await prisma.product.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId: product.id } },
      create: { userId: user.id, productId: product.id },
      update: {},
    });

    return NextResponse.json({ ok: true, items: await fetchWishlist(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { productId?: string };
    const productId = body.productId?.trim();
    if (!productId) return jsonError("상품을 선택해 주세요.", 400);

    await prisma.wishlistItem.deleteMany({
      where: { userId: user.id, productId },
    });

    return NextResponse.json({ ok: true, items: await fetchWishlist(user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
