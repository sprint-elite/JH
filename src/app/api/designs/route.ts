import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { parseBuilderPayload } from "@/lib/saved-design";
import { resolveCatalogProduct } from "@/lib/resolve-product";
import type { SavedDesignListItem } from "@/types/saved-design";

function toListItem(design: {
  id: string;
  title: string;
  builderJson: unknown;
  updatedAt: Date;
  createdAt: Date;
}): SavedDesignListItem {
  const payload = parseBuilderPayload(design.builderJson);
  return {
    id: design.id,
    title: design.title,
    productType: payload?.options.productType ?? "ecobag",
    updatedAt: design.updatedAt.toISOString(),
    createdAt: design.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const user = await requireUser();

    const designs = await prisma.design.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        builderJson: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      designs: designs.map(toListItem),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      title?: string;
      builderJson?: unknown;
      productSlug?: string;
    };

    const payload = parseBuilderPayload(body.builderJson);
    if (!payload) {
      return jsonError("저장할 작업 데이터가 올바르지 않습니다.", 400);
    }

    const title = body.title?.trim() || "무제 작업";
    const product = await resolveCatalogProduct({
      productSlug: body.productSlug,
      builderType: payload.options.productType,
    });

    const design = await prisma.design.create({
      data: {
        userId: user.id,
        productId: product?.id ?? null,
        title,
        builderJson: payload as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
        title: true,
        builderJson: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      design: {
        ...toListItem(design),
        builderJson: payload,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
