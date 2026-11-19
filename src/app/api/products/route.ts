import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { isProductSaleType } from "@/lib/product-sale-type";
import { resolveProductType } from "@/lib/catalog";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const saleTypeRaw = searchParams.get("saleType");
    const saleType =
      saleTypeRaw && isProductSaleType(saleTypeRaw) ? saleTypeRaw : undefined;

    const rows = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(saleType ? { saleType } : {}),
      },
      orderBy: [
        { isFeatured: "desc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        shortDesc: true,
        basePrice: true,
        thumbnailUrl: true,
        saleType: true,
        builderType: true,
        isFeatured: true,
        category: {
          select: {
            name: true,
            slug: true,
            parent: { select: { slug: true } },
          },
        },
      },
    });

    const products = rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDesc: p.shortDesc,
      basePrice: p.basePrice,
      thumbnailUrl: p.thumbnailUrl,
      saleType: p.saleType,
      isFeatured: p.isFeatured,
      productType: resolveProductType(p.builderType, p.slug),
      categoryName: p.category?.name ?? null,
      categorySlug: p.category?.slug ?? null,
      categoryParentSlug: p.category?.parent?.slug ?? null,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
