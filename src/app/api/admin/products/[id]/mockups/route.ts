import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  makeMockupSideKey,
  normalizeMockupFaceInput,
  type ProductMockupFaceDto,
} from "@/lib/product-mockup";

type RouteContext = { params: Promise<{ id: string }> };

function toDto(row: {
  id: string;
  side: string;
  label: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  printX: number;
  printY: number;
  printW: number;
  printH: number;
  sortOrder: number;
}): ProductMockupFaceDto {
  return {
    id: row.id,
    side: row.side,
    label: row.label,
    imageUrl: row.imageUrl,
    imageWidth: row.imageWidth,
    imageHeight: row.imageHeight,
    printX: row.printX,
    printY: row.printY,
    printW: row.printW,
    printH: row.printH,
    sortOrder: row.sortOrder,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    const rows = await prisma.productMockupFace.findMany({
      where: { productId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ mockups: rows.map(toDto) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    const body = (await request.json()) as { mockups?: unknown };
    if (!Array.isArray(body.mockups)) {
      return jsonError("목업 목록이 올바르지 않습니다.", 400);
    }

    const faces: ProductMockupFaceDto[] = [];
    for (const item of body.mockups) {
      if (!item || typeof item !== "object") continue;
      const raw = item as Record<string, unknown>;
      const sideRaw = String(raw.side ?? "").trim() || makeMockupSideKey();
      const label = String(raw.label ?? "").trim();
      if (!label) {
        return jsonError("면 이름을 입력해 주세요.", 400);
      }
      const normalized = normalizeMockupFaceInput(
        { ...raw, side: sideRaw, label },
        sideRaw,
      );
      if (!normalized) {
        return jsonError(`「${label}」면 이미지를 등록해 주세요.`, 400);
      }
      faces.push(normalized);
    }

    const sides = faces.map((f) => f.side);
    if (new Set(sides).size !== sides.length) {
      return jsonError("같은 면 키가 중복되어 있습니다.", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.productMockupFace.deleteMany({ where: { productId: id } });
      if (faces.length > 0) {
        await tx.productMockupFace.createMany({
          data: faces.map((f, i) => ({
            productId: id,
            side: f.side,
            label: f.label,
            imageUrl: f.imageUrl,
            imageWidth: f.imageWidth,
            imageHeight: f.imageHeight,
            printX: f.printX,
            printY: f.printY,
            printW: f.printW,
            printH: f.printH,
            sortOrder: f.sortOrder || i,
          })),
        });
      }
    });

    const rows = await prisma.productMockupFace.findMany({
      where: { productId: id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ mockups: rows.map(toDto) });
  } catch (err) {
    return handleApiError(err);
  }
}
