import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { generateOrderNumber, toOrderDto } from "@/lib/orders";
import {
  normalizeShippingInput,
  validateShippingInput,
} from "@/lib/order-shipping";
import {
  calculateReadyMadePrice,
  resolveShippingFee,
} from "@/lib/pricing";
import { parseProductOptionSchema } from "@/lib/product-option-schema";
import { getShippingConfig } from "@/lib/shipping";
import {
  assertStockAvailable,
  decrementStock,
} from "@/lib/inventory";
import { assertApiRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "orders-from-cart");
    const user = await requireUser();
    const body = (await request.json()) as {
      shippingName?: string;
      shippingPhone?: string;
      shippingAddress?: string;
      shippingZip?: string;
      notes?: string;
    };

    const shippingError = validateShippingInput(body);
    if (shippingError) return jsonError(shippingError, 400);
    const shipping = normalizeShippingInput(body);

    const cartRows = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            quantityDiscounts: { orderBy: { minQuantity: "asc" } },
          },
        },
      },
    });

    const lines = cartRows.filter(
      (r) => r.product.isActive && r.product.saleType === "READYMADE",
    );
    if (lines.length === 0) {
      return jsonError("장바구니가 비어 있습니다.", 400);
    }

    const shipCfg = await getShippingConfig();

    type LineCalc = {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      lineSubtotal: number;
      lineDiscount: number;
      lineTotal: number;
      baseShip: number;
    };

    const calcs: LineCalc[] = [];
    let merchandiseTotal = 0;
    let discountAmount = 0;
    let subtotal = 0;
    let maxBaseShip = shipCfg.shippingFee;

    for (const row of lines) {
      const p = row.product;
      const qty = Math.min(
        p.maxQuantity,
        Math.max(p.minQuantity, row.quantity),
      );
      const stockErr = assertStockAvailable(p.stockQuantity, qty, p.name);
      if (stockErr) return jsonError(stockErr, 400);

      const price = calculateReadyMadePrice(qty, {
        basePrice: p.basePrice,
        quantityDiscounts: p.quantityDiscounts,
      });
      const optionSchema = parseProductOptionSchema(p.optionSchema);
      const baseShip = optionSchema?.shippingFee ?? shipCfg.shippingFee;
      maxBaseShip = Math.max(maxBaseShip, baseShip);

      calcs.push({
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unitPrice: price.unitPrice,
        lineSubtotal: price.subtotal,
        lineDiscount: price.discountAmount,
        lineTotal: price.totalPrice,
        baseShip,
      });
      merchandiseTotal += price.totalPrice;
      discountAmount += price.discountAmount;
      subtotal += price.subtotal;
    }

    const shippingFee = resolveShippingFee(
      merchandiseTotal,
      maxBaseShip,
      shipCfg.freeShippingThreshold,
    );
    const primary = calcs[0]!;
    const totalQty = calcs.reduce((s, c) => s + c.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      for (const c of calcs) {
        await decrementStock(c.productId, c.quantity, tx);
      }
      const orderNumber = await generateOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          productId: primary.productId,
          designId: null,
          quantity: totalQty,
          subtotal,
          discountAmount,
          shippingFee,
          totalPrice: merchandiseTotal + shippingFee,
          paymentStatus: "UNPAID",
          status: "AWAITING_PAYMENT",
          notes: shipping.notes,
          shippingName: shipping.shippingName,
          shippingPhone: shipping.shippingPhone,
          shippingZip: shipping.shippingZip,
          shippingAddress: shipping.shippingAddress,
          items: {
            create: calcs.map((c) => ({
              productId: c.productId,
              productName: c.productName,
              quantity: c.quantity,
              unitPrice: c.unitPrice,
            })),
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

      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      return created;
    });

    return NextResponse.json({ order: toOrderDto(order) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
