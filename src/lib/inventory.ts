import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Db = Prisma.TransactionClient | typeof prisma;

/** 기성품 재고 확인. null 재고 = 무제한 */
export function assertStockAvailable(
  stockQuantity: number | null | undefined,
  quantity: number,
  productName?: string,
): string | null {
  if (stockQuantity == null) return null;
  if (stockQuantity < quantity) {
    return `${productName ?? "상품"}의 재고가 부족합니다. (남은 수량: ${stockQuantity})`;
  }
  return null;
}

export async function decrementStock(
  productId: string,
  quantity: number,
  tx: Db = prisma,
) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, name: true, saleType: true },
  });
  if (!product || product.saleType !== "READYMADE") return;
  if (product.stockQuantity == null) return;
  if (product.stockQuantity < quantity) {
    throw new Error(
      `${product.name}의 재고가 부족합니다. (남은 수량: ${product.stockQuantity})`,
    );
  }
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: { decrement: quantity } },
  });
}

export async function restoreStock(
  productId: string,
  quantity: number,
  tx: Db = prisma,
) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stockQuantity: true, saleType: true },
  });
  if (!product || product.saleType !== "READYMADE") return;
  if (product.stockQuantity == null) return;
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: { increment: quantity } },
  });
}

export type NoticeItem = { label: string; value: string };

export function parseNoticeJson(raw: unknown): NoticeItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as { label?: unknown; value?: unknown };
      const label = typeof r.label === "string" ? r.label.trim() : "";
      const value = typeof r.value === "string" ? r.value.trim() : "";
      if (!label || !value) return null;
      return { label, value };
    })
    .filter((x): x is NoticeItem => x != null);
}

/** 기본 고시 템플릿 (의류·잡화 계열) */
export const DEFAULT_NOTICE_TEMPLATE: NoticeItem[] = [
  { label: "제품 소재", value: "" },
  { label: "색상", value: "" },
  { label: "치수", value: "" },
  { label: "제조자", value: "" },
  { label: "제조국", value: "대한민국" },
  { label: "취급방법", value: "" },
  { label: "품질보증기준", value: "관련 법 및 소비자분쟁해결기준에 따름" },
  { label: "A/S 책임자·연락처", value: "" },
];
