import type { BuilderOptions, PriceResult } from "@/types/builder";

export type PricingContext = {
  basePrice?: number;
  quantityDiscounts?: Array<{
    minQuantity: number;
    unitPrice: number | null;
    discountRate: number | null;
  }>;
};

const BASE_PRICE: Record<BuilderOptions["productType"], number> = {
  ecobag: 3000,
  "shopping-bag": 4000,
  pouch: 2500,
};

const SIZE_ADDON: Record<BuilderOptions["size"], number> = {
  S: 0,
  M: 500,
  L: 1000,
  XL: 1500,
  "2XL": 2000,
  "3XL": 2500,
};

const FABRIC_ADDON: Record<BuilderOptions["fabric"], number> = {
  cotton10: 500,
  cotton20: 300,
  canvas: 1000,
  nonwoven: 0,
};

const HANDLE_ADDON: Record<BuilderOptions["handle"], number> = {
  basic: 0,
  long: 300,
  color: 500,
};

const POCKET_ADDON: Record<BuilderOptions["pocket"], number> = {
  none: 0,
  inner: 700,
  outer: 900,
};

const PRINT_SIDE_ADDON: Record<BuilderOptions["printSide"], number> = {
  front: 800,
  "front-back": 1500,
  "front-back-side": 2200,
};

function getDiscountRate(quantity: number): number {
  if (quantity >= 500) return 0.15;
  if (quantity >= 300) return 0.1;
  if (quantity >= 100) return 0.05;
  return 0;
}

function resolveBulkPricing(
  quantity: number,
  calculatedUnit: number,
  ctx?: PricingContext,
): { unitPrice: number; discountRate: number; discountAmount: number; totalPrice: number } {
  const subtotalAtCalculated = calculatedUnit * quantity;

  const rules = ctx?.quantityDiscounts;
  if (rules?.length) {
    const match = [...rules]
      .sort((a, b) => b.minQuantity - a.minQuantity)
      .find((r) => quantity >= r.minQuantity);

    if (match?.unitPrice != null) {
      const unitPrice = match.unitPrice;
      const totalPrice = unitPrice * quantity;
      const discountAmount = Math.max(0, subtotalAtCalculated - totalPrice);
      return {
        unitPrice,
        discountRate: subtotalAtCalculated > 0 ? discountAmount / subtotalAtCalculated : 0,
        discountAmount,
        totalPrice,
      };
    }

    if (match?.discountRate != null) {
      const discountAmount = Math.round(subtotalAtCalculated * match.discountRate);
      return {
        unitPrice: calculatedUnit,
        discountRate: match.discountRate,
        discountAmount,
        totalPrice: subtotalAtCalculated - discountAmount,
      };
    }
  }

  const discountRate = getDiscountRate(quantity);
  const discountAmount = Math.round(subtotalAtCalculated * discountRate);
  return {
    unitPrice: calculatedUnit,
    discountRate,
    discountAmount,
    totalPrice: subtotalAtCalculated - discountAmount,
  };
}

export function calculatePrice(
  options: BuilderOptions,
  ctx?: PricingContext,
): PriceResult {
  const qty = Math.max(1, options.quantity || 1);

  const breakdown = {
    basePrice: ctx?.basePrice ?? BASE_PRICE[options.productType],
    sizeAddon: SIZE_ADDON[options.size],
    fabricAddon: FABRIC_ADDON[options.fabric],
    handleAddon: HANDLE_ADDON[options.handle],
    pocketAddon: POCKET_ADDON[options.pocket],
    printSideAddon: PRINT_SIDE_ADDON[options.printSide],
  };

  const calculatedUnit =
    breakdown.basePrice +
    breakdown.sizeAddon +
    breakdown.fabricAddon +
    breakdown.handleAddon +
    breakdown.pocketAddon +
    breakdown.printSideAddon;

  const bulk = resolveBulkPricing(qty, calculatedUnit, ctx);

  return {
    unitPrice: bulk.unitPrice,
    subtotal: calculatedUnit * qty,
    discountRate: bulk.discountRate,
    discountAmount: bulk.discountAmount,
    totalPrice: bulk.totalPrice,
    breakdown,
  };
}

/** 기성품: 기본가 × 수량 (+ 수량할인) */
export function calculateReadyMadePrice(
  quantity: number,
  ctx: PricingContext & { basePrice: number },
): Pick<
  PriceResult,
  "unitPrice" | "subtotal" | "discountRate" | "discountAmount" | "totalPrice"
> {
  const qty = Math.max(1, quantity);
  const unit = ctx.basePrice;
  const bulk = resolveBulkPricing(qty, unit, ctx);
  return {
    unitPrice: bulk.unitPrice,
    subtotal: unit * qty,
    discountRate: bulk.discountRate,
    discountAmount: bulk.discountAmount,
    totalPrice: bulk.totalPrice,
  };
}

export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const SHIPPING_FEE = 3000;

/** 상품 합계(할인 반영)가 이 금액 이상이면 배송비 0 */
export const FREE_SHIPPING_THRESHOLD = 50_000;

export function resolveShippingFee(
  merchandiseTotal: number,
  baseFee: number = SHIPPING_FEE,
  freeThreshold: number = FREE_SHIPPING_THRESHOLD,
): number {
  if (merchandiseTotal >= freeThreshold) return 0;
  return Math.max(0, baseFee);
}

export function orderGrandTotal(
  productTotal: number,
  baseFee: number = SHIPPING_FEE,
  freeThreshold: number = FREE_SHIPPING_THRESHOLD,
): number {
  return productTotal + resolveShippingFee(productTotal, baseFee, freeThreshold);
}

export function freeShippingRemaining(
  merchandiseTotal: number,
  freeThreshold: number = FREE_SHIPPING_THRESHOLD,
): number {
  return Math.max(0, freeThreshold - merchandiseTotal);
}
