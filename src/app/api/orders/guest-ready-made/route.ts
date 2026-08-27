import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { calculateReadyMadePrice, SHIPPING_FEE } from "@/lib/pricing";
import { parseProductOptionSchema } from "@/lib/product-option-schema";
import { generateOrderNumber, toOrderDto } from "@/lib/orders";
import {
  normalizeShippingInput,
  validateShippingInput,
} from "@/lib/order-shipping";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { getSiteSettings } from "@/lib/site-settings";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePhone,
} from "@/lib/auth-validation";
import {
  assertStockAvailable,
  decrementStock,
} from "@/lib/inventory";
import { assertApiRateLimit } from "@/lib/rate-limit";

/** 비회원 기성품 주문 — 게스트 계정 생성 후 체크아웃으로 */
export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "orders-guest", 15, 15 * 60 * 1000);
    const body = (await request.json()) as {
      productSlug?: string;
      quantity?: number;
      email?: string;
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingZip?: string;
      notes?: string;
    };

    const email = normalizeEmail(body.email ?? "");
    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    const shippingError = validateShippingInput(body);
    if (shippingError) return jsonError(shippingError, 400);
    const shipping = normalizeShippingInput(body);

    const nameError = validateName(body.shippingName ?? "");
    if (nameError) return jsonError(nameError, 400);
    const phoneError = validatePhone(body.shippingPhone ?? "");
    if (phoneError) return jsonError(phoneError, 400);

    const productSlug = body.productSlug?.trim();
    if (!productSlug) return jsonError("상품을 선택해 주세요.", 400);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && !existingUser.isGuest && !existingUser.deletedAt) {
      return jsonError("이미 가입된 이메일입니다. 로그인 후 주문해 주세요.", 409);
    }

    const product = await prisma.product.findFirst({
      where: { slug: productSlug, isActive: true },
      include: {
        quantityDiscounts: { orderBy: { minQuantity: "asc" } },
      },
    });
    if (!product || product.saleType !== "READYMADE") {
      return jsonError("기성품만 비회원 주문이 가능합니다.", 400);
    }

    const quantity = Math.round(Number(body.quantity) || product.minQuantity);
    if (quantity < product.minQuantity || quantity > product.maxQuantity) {
      return jsonError("수량이 올바르지 않습니다.", 400);
    }

    const stockErr = assertStockAvailable(
      product.stockQuantity,
      quantity,
      product.name,
    );
    if (stockErr) return jsonError(stockErr, 400);

    const price = calculateReadyMadePrice(quantity, {
      basePrice: product.basePrice,
      quantityDiscounts: product.quantityDiscounts,
    });
    const settings = await getSiteSettings();
    const optionSchema = parseProductOptionSchema(product.optionSchema);
    const baseShip = optionSchema?.shippingFee ?? settings.shippingFee ?? SHIPPING_FEE;
    // free shipping threshold from settings
    const shippingFee =
      price.totalPrice >= settings.freeShippingThreshold
        ? 0
        : Math.max(0, baseShip);

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          email,
          name: (body.shippingName ?? "게스트").trim(),
          phone: body.shippingPhone?.trim() || null,
          passwordHash: null,
          isGuest: true,
          role: "CUSTOMER",
        },
      }));

    if (existingUser?.isGuest) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: (body.shippingName ?? user.name).trim(),
          phone: body.shippingPhone?.trim() || user.phone,
        },
      });
    }

    const order = await prisma.$transaction(async (tx) => {
      await decrementStock(product.id, quantity, tx);
      const orderNumber = await generateOrderNumber(tx);
      return tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          productId: product.id,
          quantity,
          subtotal: price.subtotal,
          discountAmount: price.discountAmount,
          shippingFee,
          totalPrice: price.totalPrice + shippingFee,
          paymentStatus: "UNPAID",
          status: "AWAITING_PAYMENT",
          notes: shipping.notes,
          shippingName: shipping.shippingName,
          shippingPhone: shipping.shippingPhone,
          shippingZip: shipping.shippingZip,
          shippingAddress: shipping.shippingAddress,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice: price.unitPrice,
            },
          },
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: {
            select: { id: true, name: true, slug: true, saleType: true },
          },
          items: true,
        },
      });
    });

    const session = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      { order: toOrderDto(order), guest: true },
      { status: 201 },
    );
    const cookie = sessionCookieOptions(session);
    response.cookies.set(cookie.name, cookie.value, cookie);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
