// TOMS 2026SS 단가표(2026SS단가표.pdf) 기성품 41종 임포트
// 실행: npx tsx scripts/import-store-products.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  TOMS_2026SS,
  TOMS_PDF_SECTIONS,
  HOME_TWO_MINUTE_SCENES,
  HOME_REVIEW_SAMPLES,
  displayName,
  retailPrice,
  tomsBuilderType,
  tomsSlug,
} from "./toms-2026ss-catalog";
import { syncTomsProductMockups, tomsMockupFrontUrl } from "./toms-product-mockups";
import { SITE_INFO } from "../src/lib/site-info";

const prisma = new PrismaClient();

const PDF_SECTION_SLUGS = TOMS_PDF_SECTIONS.map((s) => s.slug);

/** 구 스마트스토어·시드 카테고리 (단가표 5섹션으로 대체) */
const LEGACY_CATEGORY_SLUGS = [
  "tshirt",
  "kids",
  "hood-mtm",
  "windbreaker",
  "vest",
  "brand-t",
  "goods",
  "kids-tee",
  "kids-hood",
  "kids-bottoms",
  "zipup",
  "tee",
  "long-sleeve",
  "polo",
  "functional",
  "hoodie",
  "sweatshirt",
  "jumper",
  "baseball",
];

const CUSTOM_REMAP: Record<string, string> = {
  "ecobag-mini": "05-others",
  "kids-30s": "01-tshirts",
  "kids-polo": "03-polo",
  "kids-hoodie": "04-sweat",
  "pouch-cube": "04-sweat",
};

const OLD_READYMADE_SLUGS = [
  "ready-ecobag-basic",
  "ready-ecobag-navy",
  "ready-shopping-mart",
  "ready-shopping-compact",
  "ready-pouch-zip",
  "ready-pouch-set",
];

function catalogSlugs(): string[] {
  return TOMS_2026SS.map((p) => tomsSlug(p.code));
}

async function clearCatalogImagesAndMockups() {
  const readymadeIds = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { startsWith: "toms-" } },
        { slug: { startsWith: "store-" } },
        { saleType: "READYMADE" },
      ],
    },
    select: { id: true },
  });
  const ids = readymadeIds.map((p) => p.id);
  if (ids.length > 0) {
    const img = await prisma.productImage.deleteMany({
      where: { productId: { in: ids } },
    });
    const mock = await prisma.productMockupFace.deleteMany({
      where: { productId: { in: ids } },
    });
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { thumbnailUrl: null },
    });
    console.log("cleared images:", img.count, "| mockups:", mock.count);
  }

  const builderSlugs = ["ecobag", "shopping-bag", "pouch"];
  const builders = await prisma.product.findMany({
    where: { slug: { in: builderSlugs } },
    select: { id: true },
  });
  const builderIds = builders.map((p) => p.id);
  if (builderIds.length > 0) {
    await prisma.productImage.deleteMany({
      where: { productId: { in: builderIds } },
    });
    await prisma.productMockupFace.deleteMany({
      where: { productId: { in: builderIds } },
    });
    await prisma.product.updateMany({
      where: { id: { in: builderIds } },
      data: { thumbnailUrl: null },
    });
    console.log("builder mockups/images cleared:", builderIds.length);
  }
}

async function hideLegacyCatalogProducts() {
  const keepBuilderSlugs = ["ecobag", "shopping-bag", "pouch"];
  const catalog = catalogSlugs();
  const hidden = await prisma.product.updateMany({
    where: {
      isActive: true,
      slug: { not: { startsWith: "toms-" } },
      NOT: { slug: { in: keepBuilderSlugs } },
    },
    data: { isActive: false, isFeatured: false, isNew: false },
  });
  await prisma.product.updateMany({
    where: { slug: { in: keepBuilderSlugs } },
    data: { isFeatured: false, isNew: false, sortOrder: 9000 },
  });
  await prisma.product.updateMany({
    where: { slug: { startsWith: "store-" } },
    data: { isActive: false, isFeatured: false, isNew: false },
  });
  await prisma.product.updateMany({
    where: { slug: { in: catalog } },
    data: { isActive: true, isFeatured: true },
  });
  await prisma.product.updateMany({
    where: {
      slug: { startsWith: "toms-" },
      NOT: { slug: { in: catalog } },
    },
    data: { isActive: false, isFeatured: false, isNew: false },
  });
  console.log("legacy catalog hidden:", hidden.count);
}

async function clearAllOrders() {
  await prisma.order.updateMany({ data: { designId: null } });
  const removed = await prisma.order.deleteMany({});
  console.log("orders deleted:", removed.count);
}

async function syncHomeCollections(storeSlugs: string[]) {
  const products = await prisma.product.findMany({
    where: { slug: { in: storeSlugs }, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const bySlug = new Map(products.map((p) => [p.slug, p.id]));
  const pick = (slugs: string[]) =>
    slugs.map((s) => bySlug.get(s)).filter((id): id is string => Boolean(id));

  const bestSlugs = storeSlugs.slice(0, 8);
  const newSlugs = storeSlugs.slice(8, 18);
  const trendingSlugs = storeSlugs.slice(18, 26);

  const plan: Array<{ collection: string; productIds: string[] }> = [
    { collection: "best", productIds: pick(bestSlugs) },
    { collection: "new", productIds: pick(newSlugs) },
    { collection: "trending", productIds: pick(trendingSlugs) },
  ];

  for (const { collection: colSlug, productIds } of plan) {
    const col = await prisma.productCollection.findUnique({
      where: { slug: colSlug },
    });
    if (!col) continue;
    await prisma.productCollectionItem.deleteMany({
      where: { collectionId: col.id },
    });
    for (let i = 0; i < productIds.length; i++) {
      await prisma.productCollectionItem.create({
        data: {
          collectionId: col.id,
          productId: productIds[i]!,
          sortOrder: i,
        },
      });
    }
    console.log(`collection ${colSlug}:`, productIds.length, "items");
  }
}

async function syncHomeTwoMinuteTemplates() {
  await prisma.designTemplate.deleteMany({});
  let n = 0;
  for (let i = 0; i < HOME_TWO_MINUTE_SCENES.length; i++) {
    const scene = HOME_TWO_MINUTE_SCENES[i]!;
    const slug = tomsSlug(scene.code);
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      console.warn("2min skip (no product):", scene.code);
      continue;
    }
    await prisma.designTemplate.create({
      data: {
        productId: product.id,
        title: scene.title,
        description: scene.description,
        thumbnailUrl: tomsMockupFrontUrl(scene.code),
        sortOrder: i,
        isActive: true,
      },
    });
    n++;
  }
  console.log("HOME 2-minute templates:", n);
}

async function syncSiteSettings() {
  const existing = await prisma.siteSetting.findUnique({
    where: { id: "default" },
  });
  const prev =
    existing?.data && typeof existing.data === "object"
      ? (existing.data as Record<string, unknown>)
      : {};
  const data = {
    ...prev,
    brandName: SITE_INFO.brandName,
    companyName: SITE_INFO.companyName,
    ceoName: SITE_INFO.ceoName,
    businessNumber: SITE_INFO.businessNumber,
    mailOrderNumber: SITE_INFO.mailOrderNumber,
    address: SITE_INFO.address,
    email: SITE_INFO.email,
    phone: SITE_INFO.phone,
    hours: SITE_INFO.hours,
    bankAccount: SITE_INFO.bankAccount,
    bankHolder: SITE_INFO.bankHolder,
  };
  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data },
    update: { data },
  });
  console.log("site settings synced");
}

async function syncHomeReviews() {
  const passwordHash = await bcrypt.hash("home-review-demo", 10);

  await prisma.productReview.deleteMany({});

  let created = 0;
  for (let i = 0; i < HOME_REVIEW_SAMPLES.length; i++) {
    const sample = HOME_REVIEW_SAMPLES[i]!;
    const email = `home-review-${i}@daeji.local`;
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: sample.authorName,
        passwordHash,
        role: "CUSTOMER",
      },
      update: { name: sample.authorName },
    });

    const slug = tomsSlug(sample.code);
    const product = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!product) {
      console.warn("review skip (no product):", sample.code);
      continue;
    }
    await prisma.productReview.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: sample.rating,
        content: sample.content,
        isHot: sample.isHot,
        isVisible: true,
        createdAt: new Date(Date.now() - sample.daysAgo * 86400000),
      },
    });
    created++;
  }

  const reviewed = await prisma.productReview.groupBy({
    by: ["productId"],
    _avg: { rating: true },
    _count: { id: true },
  });
  for (const row of reviewed) {
    await prisma.product.update({
      where: { id: row.productId },
      data: {
        ratingAvg: row._avg.rating ?? 0,
        reviewCount: row._count.id,
      },
    });
  }
  await prisma.product.updateMany({
    where: {
      id: { notIn: reviewed.map((r) => r.productId) },
      slug: { startsWith: "toms-" },
    },
    data: { ratingAvg: 0, reviewCount: 0 },
  });

  console.log("HOME reviews:", created);
}

async function syncCircleNav() {
  const circles = [];
  for (const s of TOMS_PDF_SECTIONS) {
    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        category: { slug: s.slug },
        thumbnailUrl: { not: null },
      },
      orderBy: { sortOrder: "asc" },
      select: { thumbnailUrl: true },
    });
    circles.push({
      title: s.name,
      linkUrl: `/products/list/${s.slug}`,
      imageUrl: product?.thumbnailUrl ?? null,
      sortOrder: s.sortOrder,
    });
  }
  await prisma.banner.deleteMany({ where: { placement: "HOME_CIRCLE" } });
  for (const b of circles) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_CIRCLE", isActive: true },
    });
  }
  console.log("HOME_CIRCLE banners:", circles.length);
}

async function syncPdfCategories() {
  const cats = new Map<string, string>();

  for (const c of TOMS_PDF_SECTIONS) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
        parentId: null,
      },
      create: {
        slug: c.slug,
        name: c.name,
        sortOrder: c.sortOrder,
      },
    });
    cats.set(c.slug, row.id);
  }

  await prisma.category.updateMany({
    where: { slug: { in: LEGACY_CATEGORY_SLUGS } },
    data: { isActive: false },
  });

  console.log("PDF categories active:", PDF_SECTION_SLUGS.length);
  return cats;
}

async function main() {
  await clearAllOrders();
  await clearCatalogImagesAndMockups();

  const cats = await syncPdfCategories();

  for (const [slug, catSlug] of Object.entries(CUSTOM_REMAP)) {
    const catId = cats.get(catSlug);
    if (!catId) continue;
    await prisma.product.updateMany({
      where: { slug },
      data: { categoryId: catId },
    });
  }

  await prisma.product.updateMany({
    where: { slug: { in: OLD_READYMADE_SLUGS } },
    data: { isActive: false },
  });

  let created = 0;
  for (const p of TOMS_2026SS) {
    const slug = tomsSlug(p.code);
    const name = displayName(p);
    const basePrice = retailPrice(p.priceExVat);
    const shortDesc = `TOMS · VAT별도 ${p.priceExVat.toLocaleString("ko-KR")}원 (S~XL)`;
    const catId = cats.get(p.cat);
    if (!catId) {
      throw new Error(`missing category: ${p.cat} for ${p.code}`);
    }
    const builderType = tomsBuilderType(p.cat);
    await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        shortDesc,
        basePrice,
        categoryId: catId,
        saleType: "CUSTOM",
        builderType,
        stockQuantity: null,
        isActive: true,
        sortOrder: p.sortOrder,
      },
      create: {
        slug,
        name,
        shortDesc,
        basePrice,
        categoryId: catId,
        thumbnailUrl: null,
        saleType: "CUSTOM",
        builderType,
        stockQuantity: null,
        sortOrder: p.sortOrder,
      },
    });
    created++;
  }
  console.log("TOMS products upserted:", created, "| expected:", TOMS_2026SS.length);

  const slugs = catalogSlugs();
  await syncHomeCollections(slugs);
  await syncHomeTwoMinuteTemplates();
  await syncHomeReviews();
  await syncCircleNav();
  await syncSiteSettings();
  await hideLegacyCatalogProducts();
  const mockupCount = await syncTomsProductMockups(prisma);
  console.log("TOMS mockups synced:", mockupCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
