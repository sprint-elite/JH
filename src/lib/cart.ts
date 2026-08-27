import { prisma } from "@/lib/db";
import {
  calculateReadyMadePrice,
  resolveShippingFee,
} from "@/lib/pricing";
import { parseProductOptionSchema } from "@/lib/product-option-schema";
import { getShippingConfig } from "@/lib/shipping";

export type CartItemDto = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  thumbnailUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  minQuantity: number;
  maxQuantity: number;
  baseShippingFee: number;
  stockQuantity: number | null;
};

export type CartSummary = {
  items: CartItemDto[];
  itemCount: number;
  merchandiseTotal: number;
  shippingFee: number;
  grandTotal: number;
  freeShippingRemaining: number;
  freeShippingThreshold: number;
};

export async function fetchCartForUser(userId: string): Promise<CartSummary> {
  const shipCfg = await getShippingConfig();
  const rows = await prisma.cartItem.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      product: {
        include: {
          quantityDiscounts: { orderBy: { minQuantity: "asc" } },
        },
      },
    },
  });

  const items: CartItemDto[] = [];
  let merchandiseTotal = 0;
  let maxBaseShipping = shipCfg.shippingFee;

  for (const row of rows) {
    const p = row.product;
    if (!p.isActive || p.saleType !== "READYMADE") continue;

    const qty = Math.min(
      p.maxQuantity,
      Math.max(p.minQuantity, row.quantity),
    );
    const price = calculateReadyMadePrice(qty, {
      basePrice: p.basePrice,
      quantityDiscounts: p.quantityDiscounts,
    });
    const optionSchema = parseProductOptionSchema(p.optionSchema);
    const baseShip = optionSchema?.shippingFee ?? shipCfg.shippingFee;
    maxBaseShipping = Math.max(maxBaseShipping, baseShip);

    merchandiseTotal += price.totalPrice;
    items.push({
      id: row.id,
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
      thumbnailUrl: p.thumbnailUrl,
      quantity: qty,
      unitPrice: price.unitPrice,
      lineTotal: price.totalPrice,
      minQuantity: p.minQuantity,
      maxQuantity: p.maxQuantity,
      baseShippingFee: baseShip,
      stockQuantity: p.stockQuantity,
    });
  }

  const shippingFee = resolveShippingFee(
    merchandiseTotal,
    maxBaseShipping,
    shipCfg.freeShippingThreshold,
  );

  return {
    items,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    merchandiseTotal,
    shippingFee,
    grandTotal: merchandiseTotal + shippingFee,
    freeShippingRemaining: Math.max(
      0,
      shipCfg.freeShippingThreshold - merchandiseTotal,
    ),
    freeShippingThreshold: shipCfg.freeShippingThreshold,
  };
}
