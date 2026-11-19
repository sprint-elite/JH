// 사이트설정·원형 카테고리·후기만 동기화 (주문/상품 임포트 없음)
// 실행: npx tsx scripts/sync-site-home.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SITE_INFO } from "../src/lib/site-info";
import {
  TOMS_PDF_SECTIONS,
  HOME_REVIEW_SAMPLES,
  tomsSlug,
} from "./toms-2026ss-catalog";

const prisma = new PrismaClient();

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

  console.log("HOME reviews:", created);
}

async function main() {
  await syncSiteSettings();
  await syncCircleNav();
  await syncHomeReviews();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
