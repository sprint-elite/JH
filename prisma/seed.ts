import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  DEFAULT_IDEA_ARTICLES,
  defaultGuidePayloads,
  toPrismaCreateData,
} from "../src/lib/content-article";

const prisma = new PrismaClient();

const ACCOUNTS = [
  {
    email: "admin@hmaker.com",
    name: "관리자",
    password: "JhAdmin!2026",
    role: "ADMIN" as const,
  },
  {
    email: "customer@hmaker.com",
    name: "고객",
    password: "JhCustomer!2026",
    role: "CUSTOMER" as const,
  },
  {
    email: "test@naver.com",
    name: "테스트고객",
    password: "JhTest!2026",
    role: "CUSTOMER" as const,
  },
  {
    email: "test2@naver.com",
    name: "테스트관리자",
    password: "JhAdmin!2026",
    role: "ADMIN" as const,
  },
];

async function main() {
  // ── 카테고리 (단체복 라인업) ──
  const categoryDefs = [
    { slug: "tee", name: "반팔티", sortOrder: 1 },
    { slug: "polo", name: "카라티", sortOrder: 2 },
    { slug: "functional", name: "기능성", sortOrder: 3 },
    { slug: "long-sleeve", name: "긴팔티", sortOrder: 4 },
    { slug: "hoodie", name: "후드/집업", sortOrder: 5 },
    { slug: "sweatshirt", name: "맨투맨", sortOrder: 6 },
    { slug: "kids", name: "아동단체", sortOrder: 7 },
    { slug: "vest", name: "조끼", sortOrder: 8 },
    { slug: "jumper", name: "단체점퍼", sortOrder: 9 },
    { slug: "baseball", name: "야구점퍼", sortOrder: 10 },
  ];

  const categories: Record<string, { id: string }> = {};
  for (const c of categoryDefs) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: c.sortOrder, isActive: true },
      create: {
        slug: c.slug,
        name: c.name,
        sortOrder: c.sortOrder,
        isActive: true,
      },
    });
    categories[c.slug] = { id: row.id };
  }

  const legacyCategorySlugs: Array<[string, string]> = [
    ["ecobag", "tee"],
    ["shopping-bag", "polo"],
    ["pouch", "hoodie"],
  ];
  for (const [from, to] of legacyCategorySlugs) {
    const source = await prisma.category.findUnique({ where: { slug: from } });
    if (!source) continue;
    const targetId = categories[to]?.id;
    if (!targetId || source.id === targetId) continue;
    await prisma.product.updateMany({
      where: { categoryId: source.id },
      data: { categoryId: targetId },
    });
    await prisma.category.delete({ where: { id: source.id } });
  }

  // ── 커스텀 상품 (단체복 라인업) ──
  const teeOptionSchema = {
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    fabrics: ["cotton10", "cotton20", "canvas", "nonwoven"],
    colors: ["white", "ivory", "cream", "beige", "mint", "navy", "black"],
    shippingFee: 3000,
  };

  const poloOptionSchema = {
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    fabrics: ["cotton20", "nonwoven"],
    colors: ["white", "navy", "black", "beige"],
    shippingFee: 3000,
  };

  const hoodieOptionSchema = {
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    fabrics: ["cotton20", "canvas"],
    colors: ["black", "navy", "cream", "white", "beige"],
    shippingFee: 3000,
  };

  const productDefs = [
    {
      slug: "ecobag",
      builderType: "ecobag",
      name: "튼튼한 17수 라운드 반팔티",
      shortDesc: "단체티 기본 · 나염 인쇄 1장부터",
      description:
        "면 17수 라운드넥 반팔티. 동아리·체육대회·기업 단체티로 가장 많이 주문됩니다. 앞·뒷면 나염 인쇄.",
      basePrice: 5800,
      sortOrder: 1,
      isFeatured: true,
      isNew: false,
      categoryId: categories.tee.id,
      optionSchema: teeOptionSchema,
      thumbnailUrl: "/images/tee.png",
    },
    {
      slug: "ecobag-round",
      builderType: "ecobag",
      name: "흡한속건 기능성 반팔티",
      shortDesc: "야외·운동 · 쿨론 원단",
      description:
        "흡한속건 기능성 반팔티. 여름 행사·스포츠 동아리·야외 근무복으로 추천합니다.",
      basePrice: 5800,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      categoryId: categories.functional.id,
      optionSchema: { ...teeOptionSchema, fabrics: ["nonwoven", "cotton20"] },
      thumbnailUrl: "/images/tee-mint.png",
    },
    {
      slug: "ecobag-cross",
      builderType: "ecobag",
      name: "견고한 32수 라운드 반팔티",
      shortDesc: "부드러운 터치 · 데일리 단체복",
      description:
        "면 32수 라운드 반팔티. 얇고 부드러워 매장 유니폼·카페 스태프티에 잘 맞습니다.",
      basePrice: 6900,
      sortOrder: 3,
      isFeatured: false,
      isNew: true,
      categoryId: categories.tee.id,
      optionSchema: { ...teeOptionSchema, fabrics: ["canvas", "cotton20"] },
      thumbnailUrl: "/images/tee-navy.png",
    },
    {
      slug: "ecobag-mini",
      builderType: "ecobag",
      name: "아동용 쿨론 라운드 반팔티",
      shortDesc: "키즈 사이즈 · 어린이집·학원",
      description:
        "아동용 기능성 라운드 반팔티. 어린이집·학원·가족 행사 단체티로 주문됩니다.",
      basePrice: 5400,
      sortOrder: 4,
      isFeatured: false,
      isNew: false,
      categoryId: categories.kids.id,
      optionSchema: teeOptionSchema,
      thumbnailUrl: "/images/tee-black.png",
    },
    {
      slug: "shopping-bag",
      builderType: "shopping-bag",
      name: "초특가 쿨론 반팔 카라티",
      shortDesc: "매장·현장 유니폼 추천",
      description:
        "쿨론 원단 반팔 카라티. 식당·현장·봉사 유니폼으로 가성비가 좋습니다.",
      basePrice: 8900,
      sortOrder: 10,
      isFeatured: true,
      isNew: true,
      categoryId: categories.polo.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo-white.png",
    },
    {
      slug: "shopping-bag-wide",
      builderType: "shopping-bag",
      name: "고급형 20수 옆타개 카라티",
      shortDesc: "면 20수 · 포켓 없음",
      description:
        "면 20수 옆타개 카라티. 동호회·골프·기업 행사 유니폼으로 많이 나갑니다.",
      basePrice: 10900,
      sortOrder: 11,
      isFeatured: true,
      isNew: false,
      categoryId: categories.polo.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo.png",
    },
    {
      slug: "shopping-bag-fold",
      builderType: "shopping-bag",
      name: "TOMS 스타일 폴로셔츠",
      shortDesc: "두툼한 면 카라 · 단체 주문",
      description:
        "헤비 코튼 폴로셔츠. 학교·동문회·기업 워크샵 단체복으로 추천합니다.",
      basePrice: 15900,
      sortOrder: 12,
      isFeatured: false,
      isNew: true,
      categoryId: categories.polo.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo.png",
    },
    {
      slug: "pouch",
      builderType: "pouch",
      name: "특양면 이중후드 티셔츠",
      shortDesc: "기모 추가 가능 · 겨울 단체복",
      description:
        "특양면 후드티. 동아리·MT·기업 후드 단체복의 기본 아이템입니다.",
      basePrice: 22800,
      sortOrder: 20,
      isFeatured: false,
      isNew: true,
      categoryId: categories.hoodie.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "pouch-flat",
      builderType: "pouch",
      name: "크루넥 라이트 맨투맨",
      shortDesc: "가벼운 쭈리 · 봄가을 단체티",
      description:
        "라이트 쭈리 맨투맨. 후드 없이 단정한 크루넥으로 학교·회사 단체복에 잘 맞습니다.",
      basePrice: 18800,
      sortOrder: 21,
      isFeatured: true,
      isNew: true,
      categoryId: categories.sweatshirt.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-cream.png",
    },
    {
      slug: "pouch-cube",
      builderType: "pouch",
      name: "라이트 쭈리 후드집업",
      shortDesc: "집업 후드 · 스태프·현장복",
      description:
        "쭈리 후드집업. 카페·행사장 스태프복, 동아리 셋업으로 인기입니다.",
      basePrice: 26800,
      sortOrder: 22,
      isFeatured: false,
      isNew: false,
      categoryId: categories.hoodie.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-zip.png",
    },
    {
      slug: "tee-20s-basic",
      builderType: "ecobag",
      name: "베이직한 튼튼 20수 라운드 반팔티",
      shortDesc: "면 20수 · 데일리 단체",
      description:
        "면 20수 라운드 반팔티. 17수보다 부드럽고 동아리 데일리 단체티로 많이 나갑니다.",
      basePrice: 6200,
      sortOrder: 5,
      isFeatured: false,
      isNew: true,
      categoryId: categories.tee.id,
      optionSchema: { ...teeOptionSchema, fabrics: ["cotton20"] },
      thumbnailUrl: "/images/tee.png",
    },
    {
      slug: "polo-coolon-rib",
      builderType: "shopping-bag",
      name: "고급 쿨론 카라티 (소매시보리)",
      shortDesc: "시보리 소매 · 매장 유니폼",
      description:
        "소매 시보리가 있는 고급 쿨론 카라티. 카페·병원·매장 스태프복으로 단정합니다.",
      basePrice: 11900,
      sortOrder: 13,
      isFeatured: false,
      isNew: true,
      categoryId: categories.polo.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo-white.png",
    },
    {
      slug: "functional-coolon-lite",
      builderType: "ecobag",
      name: "가벼운 기능성 쿨론 반팔티",
      shortDesc: "초경량 · 여름 야외",
      description:
        "가벼운 쿨론 기능성 반팔. 체육대회·등산·야외 근무에 시원합니다.",
      basePrice: 5400,
      sortOrder: 30,
      isFeatured: true,
      isNew: true,
      categoryId: categories.functional.id,
      optionSchema: { ...teeOptionSchema, fabrics: ["nonwoven"] },
      thumbnailUrl: "/images/tee-mint.png",
    },
    {
      slug: "functional-coolon-premium",
      builderType: "ecobag",
      name: "고급 쿨론 라운드 (코오롱원사)",
      shortDesc: "프리미엄 기능성 · 흡한속건",
      description:
        "코오롱 원사 쿨론 라운드. 발색이 좋아 로고 나염 단체가 많습니다.",
      basePrice: 7900,
      sortOrder: 31,
      isFeatured: false,
      isNew: false,
      categoryId: categories.functional.id,
      optionSchema: { ...teeOptionSchema, fabrics: ["nonwoven", "cotton20"] },
      thumbnailUrl: "/images/tee-mint.png",
    },
    {
      slug: "longsleeve-20s",
      builderType: "ecobag",
      name: "고급 국산 20수 라운드 유색 긴팔",
      shortDesc: "봄가을 단체 · 면 20수",
      description:
        "국산 20수 라운드 긴팔티. 학교·교회·기업 봄가을 단체복 기본입니다.",
      basePrice: 8900,
      sortOrder: 40,
      isFeatured: true,
      isNew: true,
      categoryId: categories["long-sleeve"].id,
      optionSchema: teeOptionSchema,
      thumbnailUrl: "/images/tee-navy.png",
    },
    {
      slug: "longsleeve-heavy",
      builderType: "ecobag",
      name: "TOMS 헤비 라운드 긴팔",
      shortDesc: "두툼한 면 · 겨울 이너",
      description:
        "헤비 코튼 라운드 긴팔. 후드 안에 입거나 겨울 단체 이너로 사용합니다.",
      basePrice: 12900,
      sortOrder: 41,
      isFeatured: false,
      isNew: false,
      categoryId: categories["long-sleeve"].id,
      optionSchema: { ...teeOptionSchema, fabrics: ["canvas", "cotton10"] },
      thumbnailUrl: "/images/tee-black.png",
    },
    {
      slug: "hoodie-premium",
      builderType: "pouch",
      name: "국산 특양면 고급 후드티",
      shortDesc: "기모 추가 가능 · 동아리 후드",
      description:
        "국산 특양면 고급 후드. 기모 옵션으로 겨울 MT·동아리 후드를 맞출 수 있습니다.",
      basePrice: 24800,
      sortOrder: 23,
      isFeatured: true,
      isNew: false,
      categoryId: categories.hoodie.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "hoodie-fleece",
      builderType: "pouch",
      name: "드라이 기모 후드",
      shortDesc: "기모 안감 · 겨울 단체",
      description:
        "드라이 기모 후드티. 보온이 좋아 겨울 행사·기업 워크샵 단체복으로 나갑니다.",
      basePrice: 26800,
      sortOrder: 24,
      isFeatured: false,
      isNew: true,
      categoryId: categories.hoodie.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "sweatshirt-signature",
      builderType: "pouch",
      name: "시그니처 맨투맨",
      shortDesc: "오버핏 쭈리 · 단체 맨투맨",
      description:
        "시그니처 크루넥 맨투맨. 등판 큰 슬로건 나염에 잘 맞습니다.",
      basePrice: 19800,
      sortOrder: 50,
      isFeatured: true,
      isNew: true,
      categoryId: categories.sweatshirt.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-cream.png",
    },
    {
      slug: "sweatshirt-premium",
      builderType: "pouch",
      name: "프리미엄 기모 맨투맨",
      shortDesc: "285g 기모 · 겨울용",
      description:
        "두툼한 기모 맨투맨. 학교·기업 겨울 단체복, 팬덤 슬로건 맨투맨으로 인기입니다.",
      basePrice: 22800,
      sortOrder: 51,
      isFeatured: false,
      isNew: false,
      categoryId: categories.sweatshirt.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-cream.png",
    },
    {
      slug: "kids-30s",
      builderType: "ecobag",
      name: "고급 아동 30수 유색 라운드",
      shortDesc: "부드러운 면 · 어린이집·학원",
      description:
        "아동 30수 유색 라운드. 어린이집·학원 소풍 단체티로 많이 주문됩니다.",
      basePrice: 5900,
      sortOrder: 60,
      isFeatured: true,
      isNew: true,
      categoryId: categories.kids.id,
      optionSchema: teeOptionSchema,
      thumbnailUrl: "/images/tee.png",
    },
    {
      slug: "kids-hoodie",
      builderType: "pouch",
      name: "아동 시그니처 후드티",
      shortDesc: "키즈 후드 · 겨울 학원",
      description:
        "아동용 후드티. 학원·키즈클럽 겨울 단체복, 가족 나들이 세트로 맞춥니다.",
      basePrice: 16800,
      sortOrder: 61,
      isFeatured: false,
      isNew: true,
      categoryId: categories.kids.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "kids-polo",
      builderType: "shopping-bag",
      name: "최고급 국산 아동 30수 폴로티",
      shortDesc: "키즈 카라 · 학원 유니폼",
      description:
        "아동 30수 폴로티. 학원·태권도·어린이 합창단 유니폼으로 단정합니다.",
      basePrice: 8900,
      sortOrder: 62,
      isFeatured: false,
      isNew: false,
      categoryId: categories.kids.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo-white.png",
    },
    {
      slug: "vest-tc",
      builderType: "shopping-bag",
      name: "튼튼한 T/C 주머니 조끼",
      shortDesc: "현장·행사 스태프복",
      description:
        "T/C 주머니 조끼. 축제 스태프, 현장 안내, 봉사 단체복으로 로고 나염이 잘 됩니다.",
      basePrice: 9900,
      sortOrder: 70,
      isFeatured: true,
      isNew: true,
      categoryId: categories.vest.id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/hoodie-zip.png",
    },
    {
      slug: "vest-fleece",
      builderType: "pouch",
      name: "라이트 폴라폴리스 조끼",
      shortDesc: "가벼운 보온 · 봄가을",
      description:
        "폴라폴리스 조끼. 등산·봉사·야외 행사 스태프 보온용으로 가볍습니다.",
      basePrice: 12900,
      sortOrder: 71,
      isFeatured: false,
      isNew: false,
      categoryId: categories.vest.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-zip.png",
    },
    {
      slug: "jumper-baseball",
      builderType: "pouch",
      name: "단체 야구점퍼",
      shortDesc: "과잠 · 동아리·졸업",
      description:
        "야구점퍼(과잠). 과·동아리·졸업 단체점퍼로 등판 큰 나염이 잘 어울립니다.",
      basePrice: 39800,
      sortOrder: 80,
      isFeatured: true,
      isNew: true,
      categoryId: categories.baseball.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "jumper-windbreaker",
      builderType: "pouch",
      name: "바람막이 점퍼",
      shortDesc: "야외 행사 · 가벼운 외투",
      description:
        "바람막이 점퍼. 체육대회 스태프, 야외 행사 운영진 단체점으로 많이 나갑니다.",
      basePrice: 32800,
      sortOrder: 81,
      isFeatured: false,
      isNew: true,
      categoryId: categories.jumper.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-zip.png",
    },
    {
      slug: "jumper-hooded",
      builderType: "pouch",
      name: "후드 집업 점퍼",
      shortDesc: "가벼운 외투 · 스태프 단체",
      description:
        "후드 집업 점퍼. 야외 행사 운영진, 매장 스태프 봄가을 단체점으로 나갑니다.",
      basePrice: 34800,
      sortOrder: 82,
      isFeatured: false,
      isNew: true,
      categoryId: categories.jumper.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie-zip.png",
    },
    {
      slug: "baseball-premium",
      builderType: "pouch",
      name: "프리미엄 과잠 야구점퍼",
      shortDesc: "두툼한 과잠 · 졸업·동아리",
      description:
        "두툼한 과잠형 야구점퍼. 등판·소매 나염이 잘 나와 졸업·동아리 단체점으로 많이 나갑니다.",
      basePrice: 45800,
      sortOrder: 83,
      isFeatured: false,
      isNew: true,
      categoryId: categories.baseball.id,
      optionSchema: hoodieOptionSchema,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "longsleeve-polo",
      builderType: "shopping-bag",
      name: "초특가 쿨론 긴팔 카라티",
      shortDesc: "가을 유니폼 · 주머니 없음",
      description:
        "쿨론 긴팔 카라티. 매장·현장 가을 유니폼, 봉사 단체복으로 많이 주문됩니다.",
      basePrice: 11900,
      sortOrder: 42,
      isFeatured: false,
      isNew: true,
      categoryId: categories["long-sleeve"].id,
      optionSchema: poloOptionSchema,
      thumbnailUrl: "/images/polo.png",
    },
  ];

  const products: Record<string, { id: string }> = {};

  for (const p of productDefs) {
    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        basePrice: p.basePrice,
        sortOrder: p.sortOrder,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        categoryId: p.categoryId,
        builderType: p.builderType,
        saleType: "CUSTOM" as const,
        optionSchema: p.optionSchema,
        thumbnailUrl: p.thumbnailUrl,
        isActive: true,
        stockQuantity: null,
      },
      create: {
        ...p,
        saleType: "CUSTOM" as const,
      },
    });
    products[p.slug] = row;
  }

  // ── 기성품 ──
  const readyMadeDefs = [
    {
      slug: "ready-ecobag-basic",
      builderType: "ecobag",
      name: "기성 17수 무지 반팔티",
      shortDesc: "무인쇄 기본형 · 바로 배송",
      description: "나염 없이 바로 구매하는 17수 라운드 반팔티입니다.",
      basePrice: 6500,
      sortOrder: 100,
      isFeatured: true,
      isNew: false,
      categoryId: categories.tee.id,
      stockQuantity: 120,
      thumbnailUrl: "/images/tee.png",
    },
    {
      slug: "ready-ecobag-navy",
      builderType: "ecobag",
      name: "기성 네이비 라운드 반팔티",
      shortDesc: "네이비 컬러 · 재고 보유",
      description: "네이비 17수 무지 반팔티. 인쇄 없이 즉시 출고 가능.",
      basePrice: 6800,
      sortOrder: 101,
      isFeatured: false,
      isNew: true,
      categoryId: categories.tee.id,
      stockQuantity: 80,
      thumbnailUrl: "/images/tee-navy.png",
    },
    {
      slug: "ready-shopping-mart",
      builderType: "shopping-bag",
      name: "기성 쿨론 카라티",
      shortDesc: "매장 유니폼 · 무지",
      description: "쿨론 반팔 카라티 기성품. 로고 없이 바로 입는 유니폼용.",
      basePrice: 9900,
      sortOrder: 110,
      isFeatured: true,
      isNew: false,
      categoryId: categories.polo.id,
      stockQuantity: 60,
      thumbnailUrl: "/images/polo-white.png",
    },
    {
      slug: "ready-shopping-compact",
      builderType: "shopping-bag",
      name: "기성 긴팔 카라티",
      shortDesc: "가을·겨울 유니폼",
      description: "긴팔 카라티 기성품. 매장·현장 스태프복으로 바로 출고됩니다.",
      basePrice: 12900,
      sortOrder: 111,
      isFeatured: false,
      isNew: true,
      categoryId: categories.polo.id,
      stockQuantity: 95,
      thumbnailUrl: "/images/polo.png",
    },
    {
      slug: "ready-pouch-zip",
      builderType: "pouch",
      name: "기성 특양면 후드티",
      shortDesc: "무지 후드 · 바로 구매",
      description: "특양면 무지 후드티 기성품.",
      basePrice: 24800,
      sortOrder: 120,
      isFeatured: true,
      isNew: false,
      categoryId: categories.hoodie.id,
      stockQuantity: 200,
      thumbnailUrl: "/images/hoodie.png",
    },
    {
      slug: "ready-pouch-set",
      builderType: "pouch",
      name: "기성 후드·맨투맨 세트",
      shortDesc: "후드티 + 맨투맨",
      description: "후드티와 맨투맨을 함께 담은 기성 세트.",
      basePrice: 39800,
      sortOrder: 121,
      isFeatured: true,
      isNew: true,
      categoryId: categories.hoodie.id,
      stockQuantity: 40,
      thumbnailUrl: "/images/hoodie-cream.png",
    },
  ];

  for (const p of readyMadeDefs) {
    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        shortDesc: p.shortDesc,
        description: p.description,
        basePrice: p.basePrice,
        sortOrder: p.sortOrder,
        isFeatured: p.isFeatured,
        isNew: p.isNew,
        categoryId: p.categoryId,
        builderType: p.builderType,
        saleType: "READYMADE" as const,
        stockQuantity: p.stockQuantity,
        thumbnailUrl: p.thumbnailUrl,
        optionSchema: { shippingFee: 3000 },
        isActive: true,
        minQuantity: 1,
        maxQuantity: 99,
      },
      create: {
        ...p,
        saleType: "READYMADE" as const,
        optionSchema: { shippingFee: 3000 },
        minQuantity: 1,
        maxQuantity: 99,
      },
    });
    products[p.slug] = row;
  }

  // ── 빌더 목업 면 (반팔티 / 카라티 / 후드) ──
  const teeMockups = [
    {
      side: "front",
      label: "앞면",
      imageUrl: "/mockups/tee-front.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.28,
      printY: 0.32,
      printW: 0.44,
      printH: 0.32,
      sortOrder: 0,
    },
    {
      side: "back",
      label: "뒷면",
      imageUrl: "/mockups/tee-back.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.28,
      printY: 0.3,
      printW: 0.44,
      printH: 0.34,
      sortOrder: 1,
    },
  ];
  const poloMockups = [
    {
      side: "front",
      label: "앞면",
      imageUrl: "/mockups/polo-front.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.3,
      printY: 0.34,
      printW: 0.4,
      printH: 0.28,
      sortOrder: 0,
    },
    {
      side: "back",
      label: "뒷면",
      imageUrl: "/mockups/polo-back.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.28,
      printY: 0.3,
      printW: 0.44,
      printH: 0.34,
      sortOrder: 1,
    },
  ];
  const hoodieMockups = [
    {
      side: "front",
      label: "앞면",
      imageUrl: "/mockups/hoodie-front.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.3,
      printY: 0.34,
      printW: 0.4,
      printH: 0.28,
      sortOrder: 0,
    },
    {
      side: "back",
      label: "뒷면",
      imageUrl: "/mockups/hoodie-back.png",
      imageWidth: 400,
      imageHeight: 520,
      printX: 0.28,
      printY: 0.28,
      printW: 0.44,
      printH: 0.36,
      sortOrder: 1,
    },
  ];

  const mockupSourceByType: Record<string, string> = {
    ecobag: "ecobag",
    "shopping-bag": "shopping-bag",
    pouch: "pouch",
  };

  const mockupsBySource: Record<string, typeof teeMockups> = {
    ecobag: teeMockups,
    "shopping-bag": poloMockups,
    pouch: hoodieMockups,
  };

  async function upsertMockups(productId: string, faces: typeof teeMockups) {
    for (const face of faces) {
      await prisma.productMockupFace.upsert({
        where: { productId_side: { productId, side: face.side } },
        update: {
          label: face.label,
          imageUrl: face.imageUrl,
          imageWidth: face.imageWidth,
          imageHeight: face.imageHeight,
          printX: face.printX,
          printY: face.printY,
          printW: face.printW,
          printH: face.printH,
          sortOrder: face.sortOrder,
        },
        create: { productId, ...face },
      });
    }
    await prisma.productMockupFace.deleteMany({
      where: {
        productId,
        side: { notIn: faces.map((f) => f.side) },
      },
    });
  }

  for (const p of productDefs) {
    const sourceSlug = mockupSourceByType[p.builderType] ?? p.builderType;
    const faces = mockupsBySource[sourceSlug];
    const targetId = products[p.slug]?.id;
    if (!faces || !targetId) continue;
    await upsertMockups(targetId, faces);
  }

  // ── 수량별 할인 ──
  const discountRules = [
    { slug: "ecobag", minQuantity: 50, unitPrice: 5200, label: "50장 이상 5,200원" },
    { slug: "ecobag", minQuantity: 100, unitPrice: 4600, label: "100장 이상 4,600원" },
    { slug: "ecobag", minQuantity: 300, unitPrice: 3900, label: "300장 이상 3,900원" },
    { slug: "shopping-bag", minQuantity: 50, unitPrice: 7900, label: "50장 이상 7,900원" },
    { slug: "shopping-bag", minQuantity: 100, unitPrice: 7200, label: "100장 이상 7,200원" },
    { slug: "pouch", minQuantity: 30, unitPrice: 19800, label: "30장 이상 19,800원" },
    { slug: "pouch", minQuantity: 100, unitPrice: 16800, label: "100장 이상 16,800원" },
  ];

  for (const rule of discountRules) {
    const product = products[rule.slug];
    const existing = await prisma.quantityDiscountRule.findFirst({
      where: { productId: product.id, minQuantity: rule.minQuantity },
    });
    if (existing) {
      await prisma.quantityDiscountRule.update({
        where: { id: existing.id },
        data: { unitPrice: rule.unitPrice, label: rule.label },
      });
    } else {
      await prisma.quantityDiscountRule.create({
        data: {
          productId: product.id,
          minQuantity: rule.minQuantity,
          unitPrice: rule.unitPrice,
          label: rule.label,
        },
      });
    }
  }

  // ── 컬렉션 ──
  const collections = [
    { slug: "best", name: "재구매 베스트", type: "BEST" as const },
    { slug: "new", name: "신상품", type: "NEW" as const },
    { slug: "trending", name: "요즘 많이 커스텀", type: "TRENDING" as const },
    { slug: "quick-template", name: "1분컷 템플릿", type: "TEMPLATE" as const },
  ];

  for (const col of collections) {
    const collection = await prisma.productCollection.upsert({
      where: { slug: col.slug },
      update: { name: col.name, type: col.type },
      create: col,
    });

    const slugs =
      col.slug === "best"
        ? [
            "ecobag",
            "ecobag-round",
            "shopping-bag",
            "pouch-flat",
            "jumper-baseball",
            "vest-tc",
            "ready-ecobag-basic",
            "ready-pouch-zip",
          ]
        : col.slug === "new"
          ? [
              "functional-coolon-lite",
              "longsleeve-20s",
              "sweatshirt-signature",
              "kids-30s",
              "kids-hoodie",
              "jumper-windbreaker",
              "jumper-hooded",
              "hoodie-fleece",
              "polo-coolon-rib",
              "longsleeve-polo",
            ]
          : col.slug === "trending"
            ? [
                "ecobag",
                "ecobag-round",
                "shopping-bag",
                "pouch",
                "pouch-cube",
                "jumper-baseball",
              ]
            : ["ecobag", "shopping-bag", "pouch", "ecobag-mini", "vest-tc"];

    for (let i = 0; i < slugs.length; i++) {
      const productId = products[slugs[i]]?.id;
      if (!productId) continue;
      await prisma.productCollectionItem.upsert({
        where: {
          collectionId_productId: {
            collectionId: collection.id,
            productId,
          },
        },
        update: { sortOrder: i },
        create: {
          collectionId: collection.id,
          productId,
          sortOrder: i,
        },
      });
    }
  }

  // ── 메인 배너 ──
  const banners = [
    {
      tag: "CUSTOM DESIGN",
      title: "내 디자인으로\n입는 단체티",
      subtitle:
        "로고·문구만 올리면 바로 시안.\n1장부터 원하는 대로 나염 커스텀하세요.",
      linkUrl: "/builder",
      imageUrl: "/images/main-banner.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "17수 라운드부터\n후드집업까지",
      subtitle: "반팔티·카라티·후드·맨투맨, 수량 많을수록 장당 단가가 내려갑니다.",
      linkUrl: "/products/list",
      imageUrl: "/images/main-banner2.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "매장 유니폼은\n카라티로",
      subtitle: "쿨론·면 20수 카라티에 상호 나염. 현장복·스태프복에 딱 맞습니다.",
      linkUrl: "/products/shopping-bag",
      imageUrl: "/images/main-banner3.png",
      sortOrder: 2,
    },
    {
      tag: null,
      title: "아동부터 성인까지\n한 번에 단체",
      subtitle: "키즈 라운드·후드·폴로까지. 학원·가족 행사 단체티.",
      linkUrl: "/products/list/kids",
      imageUrl: "/images/main-banner4.png",
      sortOrder: 3,
    },
  ];

  await prisma.banner.deleteMany({ where: { placement: "HOME_HERO" } });
  for (const b of banners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_HERO", isActive: true },
    });
  }

  const circleBanners = [
    {
      title: "튼튼한 17수 라운드 반팔티",
      linkUrl: "/products/ecobag",
      imageUrl: "/images/tee.png",
      sortOrder: 0,
    },
    {
      title: "흡한속건 기능성 반팔티",
      linkUrl: "/products/ecobag-round",
      imageUrl: "/images/tee-mint.png",
      sortOrder: 1,
    },
    {
      title: "초특가 쿨론 반팔 카라티",
      linkUrl: "/products/shopping-bag",
      imageUrl: "/images/polo-white.png",
      sortOrder: 2,
    },
    {
      title: "특양면 이중후드 티셔츠",
      linkUrl: "/products/pouch",
      imageUrl: "/images/hoodie.png",
      sortOrder: 3,
    },
    {
      title: "고급형 20수 옆타개 카라티",
      linkUrl: "/products/shopping-bag-wide",
      imageUrl: "/images/polo.png",
      sortOrder: 4,
    },
    {
      title: "크루넥 라이트 맨투맨",
      linkUrl: "/products/pouch-flat",
      imageUrl: "/images/hoodie-cream.png",
      sortOrder: 5,
    },
    {
      title: "단체 야구점퍼",
      linkUrl: "/products/jumper-baseball",
      imageUrl: "/images/hoodie.png",
      sortOrder: 6,
    },
    {
      title: "튼튼한 T/C 주머니 조끼",
      linkUrl: "/products/vest-tc",
      imageUrl: "/images/hoodie-zip.png",
      sortOrder: 7,
    },
  ];

  await prisma.banner.deleteMany({ where: { placement: "HOME_CIRCLE" } });
  for (const b of circleBanners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_CIRCLE", isActive: true },
    });
  }

  const ideaBanners = [
    {
      tag: null,
      title: "커플 · 우정 단체티",
      subtitle: "이니셜 · 날짜 나염",
      linkUrl: "/ideas/couple-ecobag",
      imageUrl: "/images/idea1.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "동아리 단체복",
      subtitle: "후드 · 맨투맨",
      linkUrl: "/ideas/home-deco",
      imageUrl: "/images/idea2.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "MT · 여행 단체티",
      subtitle: "기능성 반팔",
      linkUrl: "/ideas/travel-essentials",
      imageUrl: "/images/idea3.png",
      sortOrder: 2,
    },
    {
      tag: null,
      title: "가족 · 반려동물",
      subtitle: "키즈 사이즈",
      linkUrl: "/ideas/pet-walk",
      imageUrl: "/images/idea4.png",
      sortOrder: 3,
    },
    {
      tag: null,
      title: "체육대회 · 축제",
      subtitle: "대량 나염",
      linkUrl: "/ideas/flea-market",
      imageUrl: "/images/idea5.png",
      sortOrder: 4,
    },
    {
      tag: null,
      title: "기업 유니폼",
      subtitle: "워크샵 · 입사",
      linkUrl: "/ideas/welcome-kit",
      imageUrl: "/images/idea6.png",
      sortOrder: 5,
    },
    {
      tag: null,
      title: "팬미팅 슬로건티",
      subtitle: "응원 · 생일카페",
      linkUrl: "/ideas/fan-meeting",
      imageUrl: "/images/idea7.png",
      sortOrder: 6,
    },
    {
      tag: null,
      title: "카페 스태프티",
      subtitle: "카라티 유니폼",
      linkUrl: "/ideas/cafe-opening",
      imageUrl: "/images/idea8.png",
      sortOrder: 7,
    },
  ];
  await prisma.banner.deleteMany({ where: { placement: "HOME_IDEA" } });
  for (const b of ideaBanners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_IDEA", isActive: true },
    });
  }

  const guideBanners = [
    {
      tag: null,
      title: "단체티 제작 완벽 가이드",
      subtitle: "원단·사이즈·나염 도수부터 제작 주의사항까지",
      linkUrl: "/guides/ecobag-guide",
      imageUrl: null,
      sortOrder: 0,
    },
    {
      tag: null,
      title: "매장·카페 유니폼 제작 사례",
      subtitle: "카라티·스태프티 수량별 단가와 인쇄 팁",
      linkUrl: "/guides/fnb-goods",
      imageUrl: null,
      sortOrder: 1,
    },
    {
      tag: null,
      title: "체육대회·행사 단체티 제작",
      subtitle: "학교·축제용 반팔티 대량 나염",
      linkUrl: "/guides/event-shopping-bag",
      imageUrl: null,
      sortOrder: 2,
    },
    {
      tag: null,
      title: "나염 인쇄 해상도 가이드",
      subtitle: "선명한 로고를 위한 파일 준비 꿀팁",
      linkUrl: "/guides/print-resolution",
      imageUrl: null,
      sortOrder: 3,
    },
  ];
  await prisma.banner.deleteMany({ where: { placement: "HOME_GUIDE" } });
  for (const b of guideBanners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_GUIDE", isActive: true },
    });
  }

  // ── 소개글 (가이드 · 상황별 굿즈) ──
  const contentArticles = [
    ...defaultGuidePayloads(),
    ...DEFAULT_IDEA_ARTICLES,
  ];
  for (const payload of contentArticles) {
    const data = toPrismaCreateData(payload);
    await prisma.contentArticle.upsert({
      where: { slug: data.slug },
      create: data,
      update: {
        type: data.type,
        title: data.title,
        subtitle: data.subtitle,
        coverImageUrl: data.coverImageUrl,
        cardTag: data.cardTag,
        cardGradient: data.cardGradient,
        introJson: data.introJson,
        sectionsJson: data.sectionsJson,
        faqJson: data.faqJson,
        publishedAt: data.publishedAt,
        sortOrder: data.sortOrder,
        isActive: true,
      },
    });
  }

  // ── 2분컷 템플릿 ──
  const templates = [
    {
      productSlug: "ecobag",
      title: "로고만 올리면 완성! 17수 라운드 단체티",
      description: "동아리·체육대회 기본 반팔티. 앞면 로고만 넣어도 단체티가 됩니다.",
      sortOrder: 0,
    },
    {
      productSlug: "shopping-bag",
      title: "상호만 넣으면 유니폼! 쿨론 카라티",
      description: "매장·현장 스태프복. 카라티에 상호 나염으로 바로 제작하세요.",
      sortOrder: 1,
    },
    {
      productSlug: "pouch-flat",
      title: "슬로건만 바꾸면 완성! 라이트 맨투맨",
      description: "봄가을 동아리·MT 단체복. 크루넥에 짧은 문구만 넣으면 됩니다.",
      sortOrder: 2,
    },
  ];

  await prisma.designTemplate.deleteMany({});
  for (const tpl of templates) {
    await prisma.designTemplate.create({
      data: {
        productId: products[tpl.productSlug].id,
        title: tpl.title,
        description: tpl.description,
        sortOrder: tpl.sortOrder,
      },
    });
  }

  // ── 상품 상세 섹션 (마플 스타일 하단 콘텐츠) ──
  const detailSectionDefs: Array<{
    slug: string;
    type: "STORY" | "INFO" | "GUIDE" | "SIZE" | "FAQ" | "SHIPPING" | "CAUTION";
    title: string;
    body: string;
    sortOrder: number;
  }> = [
    {
      slug: "ecobag",
      type: "STORY",
      title: "정직한 단체티, 나염으로 완성",
      body: "면 17수 라운드 반팔티에 로고와 슬로건을 담아 보세요.\n동아리, 체육대회, 기업 워크샵까지 1장부터 나염 제작할 수 있어요.\n앞·뒷면 인쇄로 우리 팀만의 단체티를 만들어 보세요.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "STORY",
      title: "수량이 늘수록 장당 단가가 내려갑니다",
      body: "시안만 올리면 제작이 시작됩니다.\n원하는 면을 고르고 로고·텍스트를 배치한 뒤 주문하세요.\n50장·100장·300장 구간 할인으로 대량 단체티도 부담이 적어요.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 반팔티 1장\n• 제조국: Made in Korea\n• 소재: 면 17수 (옵션: 20수·32수·기능성)\n• 인쇄: 나염 (앞·뒷면)\n• 최소 주문: 1장\n• 평균 제작 기간: 주문 후 3~5영업일",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | S (90) | M (95) | L (100) |\n| --- | --- | --- | --- |\n| 가슴단면 (cm) | 46 | 49 | 52 |\n| 총장 (cm) | 65 | 68 | 71 |\n| 소매길이 (cm) | 20 | 21 | 22 |",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "디자인 파일 준비",
      body: "• PNG, JPG 파일을 업로드할 수 있어요.\n• 로고는 투명 PNG 또는 벡터를 권장합니다.\n• 나염은 색 수(도수)가 적을수록 선명하고 단가가 낮아집니다.\n• 작은 원본을 무리하게 확대하면 인쇄 시 화질이 깨질 수 있어요.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "나염 유의 사항",
      body: "• 모니터·기기에 따라 실제 인쇄 색상과 차이가 있을 수 있습니다.\n• 어두운 원단에 밝은 잉크는 더블코팅을 권장합니다.\n• 1mm 이하 가는 선은 나염에서 무너질 수 있습니다.\n• 인쇄 위치·크기는 수작업 특성상 ±5mm 오차가 발생할 수 있습니다.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "몇 장부터 주문할 수 있나요?",
          a: "1장부터 가능합니다. 다만 나염은 50장 이상에서 장당 단가가 크게 내려갑니다.",
        },
        {
          q: "로고 색이 여러 개여도 되나요?",
          a: "가능합니다. 나염은 색 수(도수)만큼 판을 만들기 때문에 색이 많을수록 인쇄비가 늘어납니다.",
        },
        {
          q: "사이즈를 섞어 주문할 수 있나요?",
          a: "같은 시안이면 사이즈별 수량을 나눠 주문할 수 있습니다. 메모에 사이즈표를 남겨 주세요.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 100% 주문 제작 상품으로, 결제 완료 후 제작이 시작됩니다.\n• 평균 제작 기간: 3~5영업일 (대량 주문 시 7~10영업일)\n• 출고 후 택배 수령: 영업일 기준 1~2일\n• 배송비: 3,000원\n• 제작 준비 중 상태에서만 주문 변경·취소가 가능합니다.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "CAUTION",
      title: "주의사항",
      body: "• 주문 제작 상품은 단순 변심 교환·환불이 제한될 수 있습니다.\n• 디자인 시안과 실제 인쇄 색상·위치 차이는 교환 사유에 해당하지 않을 수 있습니다.\n• 세탁 시 단독 뒤집기·찬물 손세탁을 권장하며, 인쇄면 직접 다림질은 피해 주세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "STORY",
      title: "매장·현장에 딱 맞는 카라티",
      body: "식당, 카페, 현장, 봉사 유니폼으로 많이 나가는 쿨론·면 카라티입니다.\n상호와 로고를 담아 스태프복과 홍보를 한 번에 챙기세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 반팔 카라티 1장\n• 제조국: Made in Korea\n• 소재: 쿨론 / 면 20수\n• 인쇄: 나염 (좌가슴·등판)\n• 최소 주문: 1장",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | S | M | L |\n| --- | --- | --- | --- |\n| 가슴단면 (cm) | 48 | 51 | 54 |\n| 총장 (cm) | 66 | 69 | 72 |",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 좌가슴은 작은 로고, 등판은 상호·슬로건이 잘 어울립니다.\n• 로고는 PNG(투명 배경) 업로드를 권장합니다.\n• 텍스트는 굵은 서체가 나염 후 가독성이 좋습니다.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "주머니 있는 카라티도 있나요?",
          a: "기본은 주머니 없는 형이며, 대량 주문은 1:1 문의로 옵션을 안내드립니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 제작 완료 후 순차 출고됩니다.\n• 대량 유니폼은 제작 일정을 사전에 안내드립니다.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "STORY",
      title: "겨울 단체복의 기본, 후드티",
      body: "동아리 MT, 기업 워크샵, 팬덤 슬로건 후드로 인기 있는 특양면 후드티입니다.\n기모 추가와 앞·뒷면 나염으로 우리 팀 후드를 맞춰 보세요.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 후드티 1장\n• 소재: 특양면 (기모 옵션)\n• 인쇄: 나염 (앞·뒷면)",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | S | M | L |\n| --- | --- | --- | --- |\n| 가슴단면 (cm) | 54 | 57 | 60 |\n| 총장 (cm) | 68 | 71 | 74 |",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 후드 주머니 위 가슴 로고, 등판 큰 슬로건 조합이 가장 많습니다.\n• 기모 추가는 주문 메모에 남겨 주세요.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "기모를 넣을 수 있나요?",
          a: "가능합니다. 주문 메모에 기모 추가를 남겨 주시면 안내드립니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 후드·맨투맨은 원단 가공에 따라 반팔보다 1~2일 더 걸릴 수 있습니다.\n• 평균 4~6영업일 내 출고됩니다.",
      sortOrder: 0,
    },
  ];

  for (const slug of Object.keys(products)) {
    // 기성품은 상세 섹션 시드 생략
    const isReady = readyMadeDefs.some((r) => r.slug === slug);
    if (isReady) continue;
    await prisma.productDetailSection.deleteMany({
      where: { productId: products[slug].id },
    });
  }

  for (const sec of detailSectionDefs) {
    await prisma.productDetailSection.create({
      data: {
        productId: products[sec.slug].id,
        type: sec.type,
        title: sec.title,
        body: sec.body,
        sortOrder: sec.sortOrder,
      },
    });
  }

  // 커스텀 변형 상품에 기준 상품 상세 섹션 복제
  for (const p of productDefs) {
    const sourceSlug = mockupSourceByType[p.builderType];
    if (!sourceSlug || p.slug === sourceSlug) continue;
    const sourceId = products[sourceSlug]?.id;
    const targetId = products[p.slug]?.id;
    if (!sourceId || !targetId) continue;
    const existing = await prisma.productDetailSection.count({
      where: { productId: targetId },
    });
    if (existing > 0) continue;
    const sourceSecs = await prisma.productDetailSection.findMany({
      where: { productId: sourceId },
    });
    if (sourceSecs.length === 0) continue;
    await prisma.productDetailSection.createMany({
      data: sourceSecs.map((s) => ({
        productId: targetId,
        type: s.type,
        title: s.title,
        body: s.body,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
      })),
    });
  }

  // ── 상품 리뷰 샘플 ──
  const customer = await prisma.user.findUnique({
    where: { email: "customer@hmaker.com" },
  });
  if (customer) {
    await prisma.productReview.deleteMany({
      where: { userId: customer.id },
    });
    const reviewSamples = [
      {
        slug: "toms-085-cvt",
        rating: 5,
        content:
          "동아리 단체티 120장 085-CVT로 맞췄는데 가슴 로고 선명하고 납기도 지켜주셨어요.",
        isHot: true,
      },
      {
        slug: "toms-300-act",
        rating: 5,
        content:
          "여름 체육대회용 300-ACT 80장. 드라이 원단이라 현장 반응이 좋았습니다.",
        isHot: true,
      },
      {
        slug: "toms-302-adp",
        rating: 5,
        content:
          "매장 스태프 폴로 302-ADP 35장. 카라 나염 위치 맞춰 주셔서 만족합니다.",
        isHot: true,
      },
      {
        slug: "toms-216-mlh",
        rating: 5,
        content:
          "216-MLH 후드 30장 졸업 기념용. 색감·핏 모두 기대에 맞았어요.",
        isHot: false,
      },
    ];

    for (const rev of reviewSamples) {
      const productId = products[rev.slug]?.id;
      if (!productId) continue;
      const exists = await prisma.productReview.findFirst({
        where: { productId, userId: customer.id, content: rev.content },
      });
      if (!exists) {
        await prisma.productReview.create({
          data: {
            productId,
            userId: customer.id,
            rating: rev.rating,
            content: rev.content,
            isHot: rev.isHot,
          },
        });
      }
    }

    for (const slug of Object.keys(products)) {
      const agg = await prisma.productReview.aggregate({
        where: { productId: products[slug].id, isVisible: true },
        _avg: { rating: true },
        _count: true,
      });
      await prisma.product.update({
        where: { id: products[slug].id },
        data: {
          ratingAvg: agg._avg.rating ?? 0,
          reviewCount: agg._count,
        },
      });
    }
  }

  // ── 계정 ──
  await prisma.user.deleteMany({
    where: {
      email: { in: ["admin@jhmaker.com", "customer@jhmaker.com"] },
    },
  });

  for (const account of ACCOUNTS) {
    const passwordHash = await bcrypt.hash(account.password, 10);
    await prisma.user.upsert({
      where: { email: account.email },
      update: { name: account.name, passwordHash, role: account.role },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role,
      },
    });
  }

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      data: {
        brandName: "대지나염",
        companyName: "대지나염",
        ceoName: "김권배",
        businessNumber: "201-01-89963",
        mailOrderNumber: "제 2026-서울중구-1477호",
        address: "서울특별시 중구 을지로 000, 00층",
        email: "poet712@naver.com",
        phone: "010-4180-2269",
        hours: "평일 10:00 ~ 18:00 (주말·공휴일 휴무)",
        bankAccount: "",
        bankHolder: "대지나염",
        shippingFee: 3000,
        freeShippingThreshold: 50000,
      },
    },
    update: {
      data: {
        brandName: "대지나염",
        companyName: "대지나염",
        ceoName: "김권배",
        businessNumber: "201-01-89963",
        mailOrderNumber: "제 2026-서울중구-1477호",
        address: "서울특별시 중구 을지로 000, 00층",
        email: "poet712@naver.com",
        phone: "010-4180-2269",
        hours: "평일 10:00 ~ 18:00 (주말·공휴일 휴무)",
        bankAccount: "",
        bankHolder: "대지나염",
        shippingFee: 3000,
        freeShippingThreshold: 50000,
      },
    },
  });

  await prisma.category.deleteMany({
    where: {
      slug: { in: ["fabric-bags", "ecobag", "shopping-bag", "pouch"] },
      products: { none: {} },
    },
  });

  console.log("");
  console.log("=== 시드 완료 ===");
  console.log(
    "카테고리, 상품, 컬렉션, 배너, 소개글, 할인규칙, 템플릿, 계정, 사이트설정",
  );
  for (const a of ACCOUNTS) {
    console.log(`[${a.role}] ${a.email} / ${a.password}`);
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
