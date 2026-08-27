import { prisma } from "@/lib/db";
import type { ViewSide } from "@/types/builder";
import { DEFAULT_SIDE_LABELS } from "@/types/builder";

export type ProductMockupFaceDto = {
  id?: string;
  side: ViewSide;
  label: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  printX: number;
  printY: number;
  printW: number;
  printH: number;
  sortOrder: number;
};

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function makeMockupSideKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `face_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
  }
  return `face_${Date.now().toString(36)}`;
}

export function normalizeMockupFaceInput(
  raw: Record<string, unknown>,
  fallbackSide?: string,
): ProductMockupFaceDto | null {
  const imageUrl = String(raw.imageUrl ?? "").trim();
  if (!imageUrl) return null;

  const side = String(raw.side ?? fallbackSide ?? "").trim();
  if (!side) return null;

  const labelRaw = String(raw.label ?? "").trim();
  const label =
    labelRaw ||
    DEFAULT_SIDE_LABELS[side] ||
    side;

  const imageWidth = Math.max(1, Math.round(Number(raw.imageWidth) || 400));
  const imageHeight = Math.max(1, Math.round(Number(raw.imageHeight) || 500));
  const printX = clamp01(Number(raw.printX));
  const printY = clamp01(Number(raw.printY));
  let printW = clamp01(Number(raw.printW));
  let printH = clamp01(Number(raw.printH));
  if (printW <= 0) printW = 0.5;
  if (printH <= 0) printH = 0.5;
  if (printX + printW > 1) printW = 1 - printX;
  if (printY + printH > 1) printH = 1 - printY;

  return {
    side,
    label,
    imageUrl,
    imageWidth,
    imageHeight,
    printX,
    printY,
    printW,
    printH,
    sortOrder: Math.round(Number(raw.sortOrder) || 0),
  };
}

export async function fetchProductMockupFaces(
  productId: string,
): Promise<ProductMockupFaceDto[]> {
  const rows = await prisma.productMockupFace.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    side: r.side,
    label: r.label || DEFAULT_SIDE_LABELS[r.side] || r.side,
    imageUrl: r.imageUrl,
    imageWidth: r.imageWidth,
    imageHeight: r.imageHeight,
    printX: r.printX,
    printY: r.printY,
    printW: r.printW,
    printH: r.printH,
    sortOrder: r.sortOrder,
  }));
}
