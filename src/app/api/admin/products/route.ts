import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchAdminProducts } from "@/lib/admin-catalog";
import { isBuilderType, slugify } from "@/lib/builder-types";
import { isProductSaleType } from "@/lib/product-sale-type";

export async function GET() {
  try {
    await requireAdmin();
    const products = await fetchAdminProducts();
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;

    const name = String(body.name ?? "").trim();
    if (!name) return jsonError("상품명을 입력해 주세요.", 400);

    const saleType = body.saleType ?? "CUSTOM";
    if (!isProductSaleType(saleType)) {
      return jsonError("판매 구분이 올바르지 않습니다.", 400);
    }

    const builderType = String(body.builderType ?? "ecobag");
    if (saleType === "CUSTOM" && !isBuilderType(builderType)) {
      return jsonError("빌더 타입이 올바르지 않습니다.", 400);
    }
    if (saleType === "READYMADE" && builderType && !isBuilderType(builderType)) {
      return jsonError("빌더 타입이 올바르지 않습니다.", 400);
    }

    const slug = (
      String(body.slug ?? "").trim() ||
      slugify(name) ||
      (saleType === "CUSTOM" ? builderType : "product")
    ).toLowerCase();
    if (!slug) return jsonError("슬러그를 입력해 주세요.", 400);

    const clash = await prisma.product.findUnique({ where: { slug } });
    if (clash) return jsonError("이미 사용 중인 슬러그입니다.", 400);

    const basePrice = Number(body.basePrice);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      return jsonError("기본 가격을 확인해 주세요.", 400);
    }

    let categoryId =
      typeof body.categoryId === "string" && body.categoryId
        ? body.categoryId
        : null;
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) return jsonError("카테고리를 찾을 수 없습니다.", 400);
    }

    await prisma.product.create({
      data: {
        name,
        slug,
        saleType,
        builderType: isBuilderType(builderType) ? builderType : "ecobag",
        categoryId,
        shortDesc:
          typeof body.shortDesc === "string" ? body.shortDesc.trim() || null : null,
        description:
          typeof body.description === "string"
            ? body.description.trim() || null
            : null,
        basePrice: Math.round(basePrice),
        minQuantity: Math.max(1, Math.round(Number(body.minQuantity) || 1)),
        maxQuantity: Math.max(1, Math.round(Number(body.maxQuantity) || 9999)),
        thumbnailUrl:
          typeof body.thumbnailUrl === "string"
            ? body.thumbnailUrl.trim() || null
            : null,
        sortOrder: Math.round(Number(body.sortOrder) || 0),
        isActive: body.isActive !== false,
        isFeatured: !!body.isFeatured,
        isNew: !!body.isNew,
        optionSchema:
          body.optionSchema && typeof body.optionSchema === "object"
            ? (body.optionSchema as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
    });

    const products = await fetchAdminProducts();
    return NextResponse.json({ products }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
