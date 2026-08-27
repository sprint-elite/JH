import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchAdminCategories } from "@/lib/admin-catalog";
import { slugify } from "@/lib/builder-types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return jsonError("카테고리를 찾을 수 없습니다.", 404);

    const name = body.name?.trim() ?? existing.name;
    if (!name) return jsonError("카테고리명을 입력해 주세요.", 400);

    const slug = (body.slug?.trim() || slugify(name)).toLowerCase();
    if (!slug) return jsonError("슬러그를 입력해 주세요.", 400);

    if (slug !== existing.slug) {
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash) return jsonError("이미 사용 중인 슬러그입니다.", 400);
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        sortOrder:
          body.sortOrder !== undefined && Number.isFinite(body.sortOrder)
            ? Number(body.sortOrder)
            : existing.sortOrder,
        isActive:
          body.isActive !== undefined ? !!body.isActive : existing.isActive,
      },
    });

    const categories = await fetchAdminCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) return jsonError("카테고리를 찾을 수 없습니다.", 404);
    if (existing._count.products > 0) {
      return jsonError(
        "상품이 연결된 카테고리는 삭제할 수 없습니다. 상품을 먼저 이동하거나 비활성화하세요.",
        400,
      );
    }

    await prisma.category.delete({ where: { id } });
    const categories = await fetchAdminCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
