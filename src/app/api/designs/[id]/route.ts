import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { parseBuilderPayload } from "@/lib/saved-design";
import { resolveCatalogProduct } from "@/lib/resolve-product";
import type { SavedDesignListItem } from "@/types/saved-design";

type RouteContext = { params: Promise<{ id: string }> };

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

async function getOwnedDesign(id: string, userId: string) {
  return prisma.design.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      builderJson: true,
      updatedAt: true,
      createdAt: true,
      userId: true,
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const design = await getOwnedDesign(id, user.id);
    if (!design) {
      return jsonError("작업물을 찾을 수 없습니다.", 404);
    }

    const payload = parseBuilderPayload(design.builderJson);
    if (!payload) {
      return jsonError("저장된 작업 데이터가 손상되었습니다.", 500);
    }

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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      builderJson?: unknown;
      productSlug?: string;
    };

    const existing = await getOwnedDesign(id, user.id);
    if (!existing) {
      return jsonError("작업물을 찾을 수 없습니다.", 404);
    }

    const payload = parseBuilderPayload(body.builderJson);
    if (!payload) {
      return jsonError("저장할 작업 데이터가 올바르지 않습니다.", 400);
    }

    const title = body.title?.trim() || existing.title;
    const product = await resolveCatalogProduct({
      productSlug: body.productSlug,
      builderType: payload.options.productType,
    });

    const design = await prisma.design.update({
      where: { id },
      data: {
        title,
        productId: product?.id ?? null,
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

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const existing = await getOwnedDesign(id, user.id);
    if (!existing) {
      return jsonError("작업물을 찾을 수 없습니다.", 404);
    }

    await prisma.design.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
