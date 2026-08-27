import { prisma } from "@/lib/db";
import { toCatalogProduct, type CatalogProductDto } from "@/lib/catalog";

const productInclude = {
  category: { select: { name: true, slug: true } },
  quantityDiscounts: { orderBy: { minQuantity: "asc" as const } },
} as const;

export async function fetchWishlist(userId: string): Promise<CatalogProductDto[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: { product: { include: productInclude } },
  });
  return rows.map((r) => toCatalogProduct(r.product));
}

export async function isWishlisted(
  userId: string,
  productId: string,
): Promise<boolean> {
  const row = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  return Boolean(row);
}
