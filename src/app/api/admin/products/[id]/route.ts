import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchAdminProducts } from "@/lib/admin-catalog";
import { isBuilderType, slugify } from "@/lib/builder-types";
import { isProductSaleType } from "@/lib/product-sale-type";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      isActive?: boolean;
      isFeatured?: boolean;
      isNew?: boolean;
      sortOrder?: number;
    };

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return jsonError("상품을 찾을 수 없습니다.", 404);

    const data: {
      isActive?: boolean;
      isFeatured?: boolean;
      isNew?: boolean;
      sortOrder?: number;
    } = {};

    if (body.isActive !== undefined) data.isActive = !!body.isActive;
    if (body.isFeatured !== undefined) data.isFeatured = !!body.isFeatured;
    if (body.isNew !== undefined) data.isNew = !!body.isNew;
    if (body.sortOrder !== undefined) {
      const sortOrder = Math.round(Number(body.sortOrder));
      if (!Number.isFinite(sortOrder)) {
        return jsonError("정렬 값을 확인해 주세요.", 400);
      }
      data.sortOrder = sortOrder;
    }

    if (Object.keys(data).length === 0) {
      return jsonError("변경할 항목이 없습니다.", 400);
    }

    await prisma.product.update({ where: { id }, data });
    const products = await fetchAdminProducts();
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return jsonError("상품을 찾을 수 없습니다.", 404);

    const name = String(body.name ?? existing.name).trim();
    if (!name) return jsonError("상품명을 입력해 주세요.", 400);

    const saleType = body.saleType ?? existing.saleType;
    if (!isProductSaleType(saleType)) {
      return jsonError("판매 구분이 올바르지 않습니다.", 400);
    }

    const builderType = String(body.builderType ?? existing.builderType);
    if (saleType === "CUSTOM" && !isBuilderType(builderType)) {
      return jsonError("빌더 타입이 올바르지 않습니다.", 400);
    }

    const slug = (
      String(body.slug ?? existing.slug).trim() || slugify(name)
    ).toLowerCase();
    if (!slug) return jsonError("슬러그를 입력해 주세요.", 400);

    if (slug !== existing.slug) {
      const clash = await prisma.product.findUnique({ where: { slug } });
      if (clash) return jsonError("이미 사용 중인 슬러그입니다.", 400);
    }

    const basePrice = Number(body.basePrice ?? existing.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return jsonError("기본 가격을 확인해 주세요.", 400);
    }

    let categoryId: string | null =
      body.categoryId === null
        ? null
        : typeof body.categoryId === "string"
          ? body.categoryId || null
          : existing.categoryId;
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) return jsonError("카테고리를 찾을 수 없습니다.", 400);
    }

    await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        saleType,
        builderType: isBuilderType(builderType) ? builderType : existing.builderType,
        categoryId,
        shortDesc:
          body.shortDesc !== undefined
            ? String(body.shortDesc).trim() || null
            : existing.shortDesc,
        description:
          body.description !== undefined
            ? String(body.description).trim() || null
            : existing.description,
        basePrice: Math.round(basePrice),
        minQuantity: Math.max(
          1,
          Math.round(Number(body.minQuantity ?? existing.minQuantity) || 1),
        ),
        maxQuantity: Math.max(
          1,
          Math.round(Number(body.maxQuantity ?? existing.maxQuantity) || 9999),
        ),
        thumbnailUrl:
          body.thumbnailUrl !== undefined
            ? String(body.thumbnailUrl).trim() || null
            : existing.thumbnailUrl,
        sortOrder: Math.round(
          Number(body.sortOrder ?? existing.sortOrder) || 0,
        ),
        isActive:
          body.isActive !== undefined ? !!body.isActive : existing.isActive,
        isFeatured:
          body.isFeatured !== undefined
            ? !!body.isFeatured
            : existing.isFeatured,
        isNew: body.isNew !== undefined ? !!body.isNew : existing.isNew,
        ...(body.optionSchema !== undefined
          ? {
              optionSchema:
                body.optionSchema && typeof body.optionSchema === "object"
                  ? (body.optionSchema as Prisma.InputJsonValue)
                  : Prisma.JsonNull,
            }
          : {}),
      },
    });

    const products = await fetchAdminProducts();
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: { select: { orders: true, designs: true } },
      },
    });
    if (!existing) return jsonError("상품을 찾을 수 없습니다.", 404);

    if (existing._count.orders > 0 || existing._count.designs > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      const products = await fetchAdminProducts();
      return NextResponse.json({
        products,
        softDeleted: true,
        message:
          "주문/디자인이 있어 비활성화했습니다. (완전 삭제는 불가)",
      });
    }

    await prisma.product.delete({ where: { id } });
    const products = await fetchAdminProducts();
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
