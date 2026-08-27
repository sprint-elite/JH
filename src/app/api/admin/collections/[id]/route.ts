import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      sortOrder?: number;
      isActive?: boolean;
      productIds?: string[];
    };

    const existing = await prisma.productCollection.findUnique({ where: { id } });
    if (!existing) return jsonError("컬렉션을 찾을 수 없습니다.", 404);

    await prisma.$transaction(async (tx) => {
      await tx.productCollection.update({
        where: { id },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(body.sortOrder !== undefined
            ? { sortOrder: Number(body.sortOrder) || 0 }
            : {}),
          ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        },
      });

      if (body.productIds) {
        await tx.productCollectionItem.deleteMany({
          where: { collectionId: id },
        });
        if (body.productIds.length > 0) {
          await tx.productCollectionItem.createMany({
            data: body.productIds.map((productId, i) => ({
              collectionId: id,
              productId,
              sortOrder: i,
            })),
          });
        }
      }
    });

    const collection = await prisma.productCollection.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return NextResponse.json({ collection });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.productCollection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
