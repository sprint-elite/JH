import { prisma } from "@/lib/db";
import { isBuilderType } from "@/lib/builder-types";

const productWithDiscounts = {
  quantityDiscounts: { orderBy: { minQuantity: "asc" as const } },
};

/** 주문/디자인 저장 시 상품 해석: 슬러그 우선, 없으면 builderType */
export async function resolveCatalogProduct(opts: {
  productSlug?: string | null;
  builderType?: string | null;
}) {
  const slug = opts.productSlug?.trim();
  if (slug) {
    const bySlug = await prisma.product.findUnique({
      where: { slug },
      include: productWithDiscounts,
    });
    if (bySlug) return bySlug;
  }

  const builderType = opts.builderType?.trim();
  if (builderType && isBuilderType(builderType)) {
    const byType = await prisma.product.findFirst({
      where: { builderType, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: productWithDiscounts,
    });
    if (byType) return byType;

    const bySlugFallback = await prisma.product.findUnique({
      where: { slug: builderType },
      include: productWithDiscounts,
    });
    if (bySlugFallback) return bySlugFallback;
  }

  return null;
}
