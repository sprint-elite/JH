import { prisma } from "@/lib/db";
import { resolveProductType } from "@/lib/catalog";
import type { ProductType } from "@/types/builder";

export type ProductSearchHit = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  thumbnailUrl: string | null;
  basePrice: number;
  minQuantity: number;
  categoryName: string | null;
  productType: ProductType;
};

export async function searchProducts(
  query: string,
  take = 8,
): Promise<ProductSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { shortDesc: { contains: q } },
        { slug: { contains: q } },
        { category: { name: { contains: q } } },
      ],
    },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    take,
    select: {
      id: true,
      slug: true,
      name: true,
      shortDesc: true,
      thumbnailUrl: true,
      basePrice: true,
      minQuantity: true,
      builderType: true,
      category: { select: { name: true } },
    },
  });

  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    thumbnailUrl: p.thumbnailUrl,
    basePrice: p.basePrice,
    minQuantity: p.minQuantity,
    categoryName: p.category?.name ?? null,
    productType: resolveProductType(p.builderType, p.slug),
  }));
}
