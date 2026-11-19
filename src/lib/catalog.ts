import { prisma } from "@/lib/db";
import { parseProductOptionSchema } from "@/lib/product-option-schema";
import type { ProductListSort } from "@/lib/product-list";
import type { ProductSaleType } from "@/lib/product-sale-type";
import {
  fetchProductMockupFaces,
  type ProductMockupFaceDto,
} from "@/lib/product-mockup";
import { SIZE_LABELS, type ProductType, type SizeOption } from "@/types/builder";
import { SLUG_TO_PRODUCT_TYPE } from "@/lib/home-data";
import { isBuilderType } from "@/lib/builder-types";
import { parseNoticeJson } from "@/lib/inventory";
import { fetchHomeContentCards } from "@/lib/content-article";
import { BAG_COLOR_PRESETS } from "@/lib/fabric/bag-colors";

export type CatalogProductDto = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  basePrice: number;
  thumbnailUrl: string | null;
  isNew: boolean;
  isFeatured: boolean;
  ratingAvg: number;
  reviewCount: number;
  productType: ProductType;
  saleType: ProductSaleType;
  categorySlug: string | null;
  categoryParentSlug: string | null;
  bulkLabel: string | null;
  badge: string | null;
  colors: string[];
  sizeRange: string | null;
  groupPrice: number | null;
  stockQuantity: number | null;
};

export type HomeBannerDto = {
  id: string;
  tag: string | null;
  title: string;
  subtitle: string | null;
  linkUrl: string;
  imageUrl: string | null;
  productSlug: string | null;
};

export type HomeTemplateDto = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  productSlug: string;
  productName: string;
  priceFrom: number;
  productType: ProductType;
  /** 기성품은 상품 상세, 커스텀은 빌더 */
  href: string;
};

export type HomeReviewDto = {
  id: string;
  user: string;
  date: string;
  product: string;
  productSlug: string;
  productThumbnailUrl: string | null;
  productType: ProductType;
  productColor: string;
  rating: number;
  text: string;
  hot: boolean;
  category: string;
  href: string;
};

export type HomeContentCardDto = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  cardTag: string | null;
  gradient: string;
};

export type HomeCatalogDto = {
  banners: HomeBannerDto[];
  circleNav: HomeBannerDto[];
  ideas: HomeContentCardDto[];
  guides: HomeContentCardDto[];
  best: CatalogProductDto[];
  newArrivals: CatalogProductDto[];
  trending: CatalogProductDto[];
  templates: HomeTemplateDto[];
  allProducts: CatalogProductDto[];
  reviews: HomeReviewDto[];
};

const REVIEW_PRODUCT_COLORS: Record<string, string> = {
  ecobag: "mint",
  "shopping-bag": "cream",
  pouch: "sky",
};

const BANNER_GRADIENTS = [
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-sky-500 via-blue-500 to-indigo-600",
  "from-orange-400 via-rose-500 to-pink-600",
  "from-violet-500 via-purple-500 to-fuchsia-600",
  "from-pink-400 via-rose-400 to-red-500",
  "from-zinc-700 via-zinc-800 to-zinc-900",
] as const;

export function bannerGradient(index: number) {
  return BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];
}

export function slugToProductType(slug: string): ProductType {
  return SLUG_TO_PRODUCT_TYPE[slug] ?? "ecobag";
}

export function resolveProductType(
  builderType: string | null | undefined,
  slug: string,
): ProductType {
  if (builderType && isBuilderType(builderType)) return builderType;
  return slugToProductType(slug);
}

export function productSlugFromLink(linkUrl: string): string | null {
  const productPath = linkUrl.match(/\/products\/([^/?#]+)/);
  if (productPath) return productPath[1];
  const query = linkUrl.match(/[?&]product=([^&]+)/);
  if (query) return query[1];
  return null;
}

export function toCatalogProduct(
  p: {
    id: string;
    slug: string;
    name: string;
    shortDesc: string | null;
    basePrice: number;
    thumbnailUrl: string | null;
    isNew: boolean;
    isFeatured: boolean;
    ratingAvg: number;
    reviewCount: number;
    builderType?: string;
    saleType?: ProductSaleType;
    optionSchema?: unknown;
    category?: { slug: string } | null;
    quantityDiscounts?: {
      label: string | null;
      minQuantity: number;
      unitPrice?: number | null;
      discountRate?: number | null;
    }[];
    stockQuantity?: number | null;
  },
  badge?: string | null,
): CatalogProductDto {
  const bulk = p.quantityDiscounts?.[0]?.label ?? null;
  const schema = parseProductOptionSchema(p.optionSchema);
  const colors = (schema?.colors ?? [])
    .map((id) => BAG_COLOR_PRESETS.find((c) => c.id === id)?.hex)
    .filter((hex): hex is string => Boolean(hex));
  const sizes = schema?.sizes ?? [];
  const sizeRange =
    sizes.length >= 2
      ? `${SIZE_LABELS[sizes[0] as SizeOption] ?? sizes[0]} ~ ${SIZE_LABELS[sizes[sizes.length - 1] as SizeOption] ?? sizes[sizes.length - 1]}`
      : sizes.length === 1
        ? (SIZE_LABELS[sizes[0] as SizeOption] ?? sizes[0])
        : "S (90) ~ L (100)";
  const deal = p.quantityDiscounts?.[0];
  let groupPrice: number | null = null;
  if (deal?.unitPrice != null && deal.unitPrice < p.basePrice) {
    groupPrice = deal.unitPrice;
  } else if (deal?.discountRate && deal.discountRate > 0) {
    groupPrice = Math.round(p.basePrice * (1 - deal.discountRate));
  }
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    basePrice: p.basePrice,
    thumbnailUrl: p.thumbnailUrl,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    ratingAvg: p.ratingAvg,
    reviewCount: p.reviewCount,
    productType: resolveProductType(p.builderType, p.slug),
    saleType: p.saleType ?? "CUSTOM",
    categorySlug: p.category?.slug ?? null,
    categoryParentSlug: p.category?.parent?.slug ?? null,
    bulkLabel: bulk,
    badge: badge ?? (p.isNew ? "NEW" : p.isFeatured ? "BEST" : null),
    colors,
    sizeRange,
    groupPrice,
    stockQuantity: p.stockQuantity ?? null,
  };
}

const productInclude = {
  category: { select: { slug: true, parent: { select: { slug: true } } } },
  quantityDiscounts: {
    orderBy: { minQuantity: "asc" as const },
    take: 1,
    select: { label: true, minQuantity: true, unitPrice: true, discountRate: true },
  },
};

async function productsInCollection(slug: string): Promise<CatalogProductDto[]> {
  const collection = await prisma.productCollection.findFirst({
    where: { slug, isActive: true },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: { include: productInclude },
        },
      },
    },
  });

  if (!collection) return [];

  return collection.items
    .map((item) => item.product)
    .filter((p) => p.isActive)
    .map((p) => toCatalogProduct(p));
}

async function fallbackProducts(
  filter: { isFeatured?: boolean; isNew?: boolean },
  take = 12,
): Promise<CatalogProductDto[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, ...filter },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take,
    include: productInclude,
  });
  return rows.map((p) => toCatalogProduct(p));
}

async function allActiveProducts(): Promise<CatalogProductDto[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: productInclude,
  });
  return rows.map((p) => toCatalogProduct(p));
}

function productListOrderBy(sort: ProductListSort) {
  switch (sort) {
    case "price-asc":
      return [{ basePrice: "asc" as const }, { sortOrder: "asc" as const }];
    case "price-desc":
      return [{ basePrice: "desc" as const }, { sortOrder: "asc" as const }];
    default:
      return [
        { isFeatured: "desc" as const },
        { sortOrder: "asc" as const },
        { createdAt: "asc" as const },
      ];
  }
}

export async function fetchProductList(options?: {
  categorySlug?: string | null;
  sort?: ProductListSort;
}): Promise<CatalogProductDto[]> {
  const sort = options?.sort ?? "recommended";
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(options?.categorySlug
        ? {
            OR: [
              { category: { slug: options.categorySlug, isActive: true } },
              {
                category: {
                  isActive: true,
                  parent: { is: { slug: options.categorySlug, isActive: true } },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: productListOrderBy(sort),
    include: productInclude,
  });
  return rows.map((p) => toCatalogProduct(p));
}

export async function fetchHomeCatalog(): Promise<HomeCatalogDto> {
  const [
    bannerRows,
    circleRows,
    ideaCards,
    guideCards,
    best,
    newArrivals,
    trending,
    templateRows,
    allProducts,
    reviewRows,
  ] = await Promise.all([
    prisma.banner.findMany({
      where: { placement: "HOME_HERO", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.banner.findMany({
      where: { placement: "HOME_CIRCLE", isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    fetchHomeContentCards("IDEA"),
    fetchHomeContentCards("GUIDE"),
    productsInCollection("best"),
    productsInCollection("new"),
    productsInCollection("trending"),
    prisma.designTemplate.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        product: {
          select: {
            slug: true,
            name: true,
            basePrice: true,
            builderType: true,
            saleType: true,
            isActive: true,
            thumbnailUrl: true,
          },
        },
      },
    }),
    allActiveProducts(),
    prisma.productReview.findMany({
      where: { isVisible: true },
      orderBy: [{ isHot: "desc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        user: { select: { name: true } },
        product: {
          select: {
            name: true,
            slug: true,
            builderType: true,
            thumbnailUrl: true,
            category: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const toBannerDto = (
    b: (typeof bannerRows)[number],
  ): HomeBannerDto => ({
    id: b.id,
    tag: b.tag,
    title: b.title,
    subtitle: b.subtitle,
    linkUrl: b.linkUrl,
    imageUrl: b.imageUrl,
    productSlug: productSlugFromLink(b.linkUrl),
  });

  const banners: HomeBannerDto[] = bannerRows.map(toBannerDto);
  const ideas: HomeContentCardDto[] = ideaCards;
  const guides: HomeContentCardDto[] = guideCards;

  const templates: HomeTemplateDto[] = templateRows
    .filter((t) => t.product && t.product.isActive)
    .slice(0, 3)
    .map((t) => {
      const isReadyMade = t.product.saleType === "READYMADE";
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        thumbnailUrl: t.thumbnailUrl ?? t.product.thumbnailUrl,
        productSlug: t.product.slug,
        productName: t.product.name,
        priceFrom: t.product.basePrice,
        productType: resolveProductType(t.product.builderType, t.product.slug),
        href: isReadyMade
          ? `/products/${t.product.slug}`
          : `/builder?product=${encodeURIComponent(t.product.slug)}`,
      };
    });

  const reviews: HomeReviewDto[] = reviewRows.map((r) => {
    const productType = resolveProductType(
      r.product.builderType,
      r.product.slug,
    );
    const isToms = r.product.slug.startsWith("toms-");
    return {
      id: r.id,
      user: maskUserName(r.user.name),
      date: new Date(r.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
      product: r.product.name,
      productSlug: r.product.slug,
      productThumbnailUrl: r.product.thumbnailUrl,
      productType,
      productColor: isToms
        ? "zinc"
        : (REVIEW_PRODUCT_COLORS[productType] ?? "mint"),
      rating: r.rating,
      text: r.content,
      hot: r.isHot,
      category: r.product.category?.name ?? "상품",
      href: `/products/${r.product.slug}`,
    };
  });

  const bestResolved = best.length
    ? best
    : await fallbackProducts({ isFeatured: true });

  const circleProducts = circleRows.length
    ? []
    : await prisma.product.findMany({
        where: { isActive: true, saleType: "READYMADE" },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
        take: 8,
        include: productInclude,
      });

  const circleNav: HomeBannerDto[] = circleRows.length
    ? circleRows.map(toBannerDto)
    : circleProducts.map(toCatalogProduct).map((p) => ({
        id: p.id,
        tag: null,
        title: p.name,
        subtitle: null,
        linkUrl: `/products/${p.slug}`,
        imageUrl: p.thumbnailUrl,
        productSlug: p.slug,
      }));

  return {
    banners,
    circleNav,
    ideas,
    guides,
    best: bestResolved,
    newArrivals: newArrivals.length
      ? newArrivals
      : await fallbackProducts({ isNew: true }),
    trending: trending.length ? trending : allProducts.slice(0, 8),
    templates,
    allProducts,
    reviews,
  };
}

export async function fetchProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      quantityDiscounts: { orderBy: { minQuantity: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}

export type ProductDetailSectionDto = {
  id: string;
  type: string;
  title: string;
  body: string;
  imageUrl: string | null;
  sortOrder: number;
};

export type ProductReviewDto = {
  id: string;
  rating: number;
  content: string;
  isHot: boolean;
  createdAt: string;
  userName: string;
};

export type ProductDetailDto = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string | null;
  basePrice: number;
  minQuantity: number;
  maxQuantity: number;
  stockQuantity: number | null;
  noticeItems: Array<{ label: string; value: string }>;
  ratingAvg: number;
  reviewCount: number;
  categoryName: string | null;
  categorySlug: string | null;
  productType: ProductType;
  saleType: ProductSaleType;
  thumbnailUrl: string | null;
  images: Array<{ url: string; alt: string | null }>;
  bulkLabel: string | null;
  optionSchema: ReturnType<typeof parseProductOptionSchema>;
  mockupFaces: ProductMockupFaceDto[];
  quantityDiscounts: Array<{
    minQuantity: number;
    unitPrice: number | null;
    discountRate: number | null;
    label: string | null;
  }>;
  sections: ProductDetailSectionDto[];
  reviews: ProductReviewDto[];
  related: CatalogProductDto[];
};

export async function fetchProductDetailBySlug(
  slug: string,
): Promise<ProductDetailDto | null> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      quantityDiscounts: { orderBy: { minQuantity: "asc" } },
      detailSections: {
        where: { isActive: true },
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      },
      reviews: {
        where: { isVisible: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!product) return null;

  const relatedRows = await prisma.product.findMany({
    where: {
      isActive: true,
      slug: { not: slug },
      ...(product.categoryId ? { categoryId: product.categoryId } : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: 4,
    include: productInclude,
  });

  const bulkLabel =
    product.quantityDiscounts[0]?.label ??
    (product.quantityDiscounts[0]?.unitPrice
      ? `${product.quantityDiscounts[0].minQuantity}개 이상 ${product.quantityDiscounts[0].unitPrice.toLocaleString("ko-KR")}원`
      : null);

  const mockupFaces = await fetchProductMockupFaces(product.id);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDesc: product.shortDesc,
    description: product.description,
    basePrice: product.basePrice,
    minQuantity: product.minQuantity,
    maxQuantity: product.maxQuantity,
    stockQuantity: product.stockQuantity,
    noticeItems: parseNoticeJson(product.noticeJson),
    ratingAvg: product.ratingAvg,
    reviewCount: product.reviewCount,
    categoryName: product.category?.name ?? null,
    categorySlug: product.category?.slug ?? null,
    productType: resolveProductType(product.builderType, product.slug),
    saleType: product.saleType,
    thumbnailUrl: product.thumbnailUrl,
    images: product.images.map((img) => ({ url: img.url, alt: img.alt })),
    bulkLabel,
    optionSchema: parseProductOptionSchema(product.optionSchema),
    mockupFaces,
    quantityDiscounts: product.quantityDiscounts.map((d) => ({
      minQuantity: d.minQuantity,
      unitPrice: d.unitPrice,
      discountRate: d.discountRate,
      label: d.label,
    })),
    sections: product.detailSections.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      body: s.body,
      imageUrl: s.imageUrl,
      sortOrder: s.sortOrder,
    })),
    reviews: product.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      isHot: r.isHot,
      createdAt: r.createdAt.toISOString(),
      userName: maskUserName(r.user.name),
    })),
    related: relatedRows.map((p) => toCatalogProduct(p)),
  };
}

function maskUserName(name: string): string {
  if (name.length <= 1) return `${name}***`;
  return `${name[0]}${"*".repeat(Math.min(3, name.length - 1))}`;
}

export async function fetchAllProductSlugs(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
