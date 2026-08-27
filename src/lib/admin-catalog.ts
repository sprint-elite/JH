import { prisma } from "@/lib/db";
import { isBuilderType } from "@/lib/builder-types";
import type { ProductSaleType } from "@/lib/product-sale-type";
import type { ProductType } from "@/types/builder";

export type AdminCategoryDto = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductDto = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string | null;
  basePrice: number;
  minQuantity: number;
  maxQuantity: number;
  stockQuantity: number | null;
  thumbnailUrl: string | null;
  saleType: ProductSaleType;
  builderType: ProductType;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  sortOrder: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  ratingAvg: number;
  reviewCount: number;
  mockupFaceCount: number;
  orderCount: number;
  designCount: number;
  imageCount: number;
  discountRuleCount: number;
  optionSchema: unknown;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAdminCategories(): Promise<AdminCategoryDto[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: c._count.products,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));
}

export async function fetchAdminProducts(): Promise<AdminProductDto[]> {
  const rows = await prisma.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          mockupFaces: true,
          orders: true,
          designs: true,
          images: true,
          quantityDiscounts: true,
        },
      },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    description: p.description,
    basePrice: p.basePrice,
    minQuantity: p.minQuantity,
    maxQuantity: p.maxQuantity,
    stockQuantity: p.stockQuantity,
    thumbnailUrl: p.thumbnailUrl,
    saleType: p.saleType,
    builderType: (isBuilderType(p.builderType)
      ? p.builderType
      : "ecobag") as ProductType,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    categorySlug: p.category?.slug ?? null,
    sortOrder: p.sortOrder,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    mockupFaceCount: p._count.mockupFaces,
    orderCount: p._count.orders,
    designCount: p._count.designs,
    imageCount: p._count.images,
    discountRuleCount: p._count.quantityDiscounts,
    optionSchema: p.optionSchema,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export async function fetchStorefrontCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      _count: {
        select: {
          products: { where: { isActive: true } },
        },
      },
    },
  });
}
