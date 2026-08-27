import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** 원래 홈 상수 IDEA_BANNERS 8개와 동일 */
const IDEA_BANNERS = [
  {
    tag: "💕",
    title: "커플 에코백",
    subtitle: "우정 · 커플 굿즈",
    linkUrl: "/products/ecobag",
    imageUrl: "/images/couple_ecobag.png",
    sortOrder: 0,
  },
  {
    tag: "🏠",
    title: "집꾸미기",
    subtitle: "파우치 · 수납",
    linkUrl: "/products/pouch",
    imageUrl: "/images/house.png",
    sortOrder: 1,
  },
  {
    tag: "✈️",
    title: "여행 필수템",
    subtitle: "에코백 · 장바구니",
    linkUrl: "/products/ecobag",
    imageUrl: "/images/trip.png",
    sortOrder: 2,
  },
  {
    tag: "🐕",
    title: "반려동물 산책",
    subtitle: "산책용 파우치",
    linkUrl: "/products/pouch",
    imageUrl: "/images/pet.png",
    sortOrder: 3,
  },
  {
    tag: "🛒",
    title: "마켓·플리마켓",
    subtitle: "장바구니 대량",
    linkUrl: "/products/shopping-bag",
    imageUrl: "/images/market.png",
    sortOrder: 4,
  },
  {
    tag: "🏢",
    title: "기업 웰컴 키트",
    subtitle: "브랜드 맞춤",
    linkUrl: "/products/ecobag",
    imageUrl: "/images/company.png",
    sortOrder: 5,
  },
  {
    tag: "⭐",
    title: "팬미팅 굿즈",
    subtitle: "최애 굿즈 제작",
    linkUrl: "/products/ecobag",
    imageUrl: "/images/goods.png",
    sortOrder: 6,
  },
  {
    tag: "☕",
    title: "카페 오픈 기념",
    subtitle: "에코백 + 파우치",
    linkUrl: "/products/pouch",
    imageUrl: "/images/coffee.png",
    sortOrder: 7,
  },
];

const GUIDE_BANNERS = [
  {
    title: "에코백 제작 완벽 가이드",
    subtitle: "사이즈·원단·인쇄면 선택부터 제작 주의사항까지",
    linkUrl: "/products/ecobag",
    sortOrder: 0,
  },
  {
    title: "F&B 브랜드 굿즈 제작 사례",
    subtitle: "카페·베이커리 에코백 제작 사례와 수량별 가격",
    linkUrl: "/builder",
    sortOrder: 1,
  },
  {
    title: "단체 행사 장바구니 제작",
    subtitle: "마켓·축제용 장바구니 1개부터 대량 제작",
    linkUrl: "/products/shopping-bag",
    sortOrder: 2,
  },
  {
    title: "이미지 해상도 가이드",
    subtitle: "선명한 인쇄를 위한 이미지 준비 꿀팁",
    linkUrl: "/builder",
    sortOrder: 3,
  },
];

async function main() {
  await prisma.banner.deleteMany({ where: { placement: "HOME_IDEA" } });
  await prisma.banner.createMany({
    data: IDEA_BANNERS.map((b) => ({
      ...b,
      placement: "HOME_IDEA" as const,
      isActive: true,
    })),
  });

  await prisma.banner.deleteMany({ where: { placement: "HOME_GUIDE" } });
  await prisma.banner.createMany({
    data: GUIDE_BANNERS.map((b) => ({
      ...b,
      placement: "HOME_GUIDE" as const,
      tag: null,
      imageUrl: null,
      isActive: true,
    })),
  });

  const ideaCount = await prisma.banner.count({
    where: { placement: "HOME_IDEA", isActive: true },
  });
  console.log(`HOME_IDEA restored: ${ideaCount} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
