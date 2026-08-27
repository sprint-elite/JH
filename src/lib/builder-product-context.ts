import type { BuilderProductContextValue } from "@/components/builder/BuilderProductContext";
import { fetchProductBySlug } from "@/lib/catalog";
import { parseProductOptionSchema } from "@/lib/product-option-schema";
import {
  fetchProductMockupFaces,
  type ProductMockupFaceDto,
} from "@/lib/product-mockup";

export type BuilderProductSource = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  shortDesc: string | null;
  basePrice: number;
  ratingAvg: number;
  reviewCount: number;
  bulkLabel: string | null;
  minQuantity: number;
  maxQuantity: number;
  quantityDiscounts: Array<{
    minQuantity: number;
    unitPrice: number | null;
    discountRate: number | null;
    label: string | null;
  }>;
  optionSchema: ReturnType<typeof parseProductOptionSchema>;
  mockupFaces?: ProductMockupFaceDto[];
};

export function toBuilderProductContext(
  product: BuilderProductSource,
): BuilderProductContextValue {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryName: product.categoryName,
    shortDesc: product.shortDesc,
    basePrice: product.basePrice,
    ratingAvg: product.ratingAvg,
    reviewCount: product.reviewCount,
    bulkLabel: product.bulkLabel,
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    quantityDiscounts: product.quantityDiscounts,
    optionSchema: product.optionSchema,
    mockupFaces: product.mockupFaces ?? [],
  };
}

export async function fetchBuilderProductContext(
  slug: string,
): Promise<BuilderProductContextValue | null> {
  const product = await fetchProductBySlug(slug);
  if (!product) return null;

  const bulkLabel =
    product.quantityDiscounts[0]?.label ??
    (product.quantityDiscounts[0]?.unitPrice
      ? `${product.quantityDiscounts[0].minQuantity}개 이상 ${product.quantityDiscounts[0].unitPrice.toLocaleString("ko-KR")}원`
      : null);

  const mockupFaces = await fetchProductMockupFaces(product.id);

  return toBuilderProductContext({
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryName: product.category?.name ?? null,
    shortDesc: product.shortDesc,
    basePrice: product.basePrice,
    ratingAvg: product.ratingAvg,
    reviewCount: product.reviewCount,
    bulkLabel,
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    quantityDiscounts: product.quantityDiscounts.map((d) => ({
      minQuantity: d.minQuantity,
      unitPrice: d.unitPrice,
      discountRate: d.discountRate,
      label: d.label,
    })),
    optionSchema: parseProductOptionSchema(product.optionSchema),
    mockupFaces,
  });
}
