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
  // ── 카테고리 (에코백 / 장바구니 / 파우치) ──
  const categoryDefs = [
    { slug: "ecobag", name: "에코백", sortOrder: 1 },
    { slug: "shopping-bag", name: "장바구니", sortOrder: 2 },
    { slug: "pouch", name: "파우치", sortOrder: 3 },
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

  // 구 카테고리 비활성
  await prisma.category.updateMany({
    where: { slug: "fabric-bags" },
    data: { isActive: false },
  });

  // ── 커스텀 상품 (에코백 / 장바구니 / 파우치 여러 종) ──
  const ecobagOptionSchema = {
    sizes: ["S", "M", "L"],
    fabrics: ["cotton10", "cotton20", "canvas", "nonwoven"],
    colors: ["cream", "white", "ivory", "beige", "mint", "navy", "black"],
    handleStrapColors: ["cream", "white", "ivory", "beige", "navy", "black"],
    closureTypes: ["magnetic", "snap", "none"],
    bagShapes: [
      "bottom-base",
      "band",
      "plain",
      "cross",
      "cross-handle",
      "side-stitch",
      "side-width",
      "cylinder",
      "drawstring",
    ],
    shippingFee: 3000,
  };

  const shoppingOptionSchema = {
    sizes: ["M", "L"],
    fabrics: ["nonwoven", "cotton10"],
    colors: ["cream", "white", "navy"],
    shippingFee: 3000,
  };

  const pouchOptionSchema = {
    sizes: ["S", "M"],
    fabrics: ["cotton10", "cotton20"],
    colors: ["sky", "mint", "pink", "white", "black"],
    shippingFee: 3000,
  };

  const productDefs = [
    {
      slug: "ecobag",
      builderType: "ecobag",
      name: "사각 에코백",
      shortDesc: "문구·이미지 커스텀, 1개부터 제작",
      description:
        "면·캔버스 원단 에코백. 앞·뒤·측면 인쇄 옵션, 수량별 할인 지원.",
      basePrice: 3500,
      sortOrder: 1,
      isFeatured: true,
      isNew: false,
      categoryId: categories.ecobag.id,
      optionSchema: ecobagOptionSchema,
    },
    {
      slug: "ecobag-round",
      builderType: "ecobag",
      name: "라운드 에코백",
      shortDesc: "둥근 실루엣 · 데일리 추천",
      description: "부드러운 라운드 형태의 에코백. 로고·일러스트 인쇄에 적합합니다.",
      basePrice: 3800,
      sortOrder: 2,
      isFeatured: true,
      isNew: true,
      categoryId: categories.ecobag.id,
      optionSchema: ecobagOptionSchema,
    },
    {
      slug: "ecobag-cross",
      builderType: "ecobag",
      name: "크로스 에코백",
      shortDesc: "크로스 스트랩 · 야외·행사",
      description: "크로스형 손잡이 에코백. 행사·배포용으로 많이 주문됩니다.",
      basePrice: 4200,
      sortOrder: 3,
      isFeatured: false,
      isNew: true,
      categoryId: categories.ecobag.id,
      optionSchema: ecobagOptionSchema,
    },
    {
      slug: "ecobag-mini",
      builderType: "ecobag",
      name: "미니 에코백",
      shortDesc: "소형 · 판촉·굿즈용",
      description: "작은 사이즈 에코백. 팬미팅·판촉물로 인기입니다.",
      basePrice: 2900,
      sortOrder: 4,
      isFeatured: false,
      isNew: false,
      categoryId: categories.ecobag.id,
      optionSchema: ecobagOptionSchema,
    },
    {
      slug: "shopping-bag",
      builderType: "shopping-bag",
      name: "장바구니",
      shortDesc: "마켓·행사용 대량 제작 추천",
      description: "플리마켓·행사용 장바구니. 로고·문구 인쇄 가능.",
      basePrice: 2800,
      sortOrder: 10,
      isFeatured: true,
      isNew: true,
      categoryId: categories["shopping-bag"].id,
      optionSchema: shoppingOptionSchema,
    },
    {
      slug: "shopping-bag-wide",
      builderType: "shopping-bag",
      name: "와이드 장바구니",
      shortDesc: "넓은 바닥 · 장보기용",
      description: "바닥이 넓은 장바구니. 과일·생필품 담기에 좋습니다.",
      basePrice: 3200,
      sortOrder: 11,
      isFeatured: true,
      isNew: false,
      categoryId: categories["shopping-bag"].id,
      optionSchema: shoppingOptionSchema,
    },
    {
      slug: "shopping-bag-fold",
      builderType: "shopping-bag",
      name: "접이식 장바구니",
      shortDesc: "접어서 보관 · 휴대용",
      description: "접이식 장바구니. 가방에 넣어 다니기 쉽습니다.",
      basePrice: 3000,
      sortOrder: 12,
      isFeatured: false,
      isNew: true,
      categoryId: categories["shopping-bag"].id,
      optionSchema: shoppingOptionSchema,
    },
    {
      slug: "pouch",
      builderType: "pouch",
      name: "파우치",
      shortDesc: "소형 굿즈·팬미팅 추천",
      description: "지퍼형 파우치. 3면 인쇄 옵션.",
      basePrice: 2200,
      sortOrder: 20,
      isFeatured: false,
      isNew: true,
      categoryId: categories.pouch.id,
      optionSchema: pouchOptionSchema,
    },
    {
      slug: "pouch-flat",
      builderType: "pouch",
      name: "플랫 파우치",
      shortDesc: "얇은 형 · 문구·카드 수납",
      description: "슬림한 플랫 파우치. 카드·화장품 미니 키트용.",
      basePrice: 1900,
      sortOrder: 21,
      isFeatured: true,
      isNew: true,
      categoryId: categories.pouch.id,
      optionSchema: pouchOptionSchema,
    },
    {
      slug: "pouch-cube",
      builderType: "pouch",
      name: "큐브 파우치",
      shortDesc: "입체형 · 용량 UP",
      description: "입체 큐브형 파우치. 케이블·소품 정리에 적합합니다.",
      basePrice: 2500,
      sortOrder: 22,
      isFeatured: false,
      isNew: false,
      categoryId: categories.pouch.id,
      optionSchema: pouchOptionSchema,
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
      name: "기성 에코백 베이직",
      shortDesc: "무인쇄 기본형 · 바로 배송",
      description: "커스텀 없이 바로 구매하는 기본 에코백입니다.",
      basePrice: 4500,
      sortOrder: 100,
      isFeatured: true,
      isNew: false,
      categoryId: categories.ecobag.id,
      stockQuantity: 120,
    },
    {
      slug: "ready-ecobag-navy",
      builderType: "ecobag",
      name: "기성 에코백 네이비",
      shortDesc: "네이비 컬러 · 재고 보유",
      description: "네이비 원단 기성 에코백. 인쇄 없이 즉시 출고 가능.",
      basePrice: 4800,
      sortOrder: 101,
      isFeatured: false,
      isNew: true,
      categoryId: categories.ecobag.id,
      stockQuantity: 80,
    },
    {
      slug: "ready-shopping-mart",
      builderType: "shopping-bag",
      name: "기성 장바구니 마트형",
      shortDesc: "장보기용 · 대용량",
      description: "마트·시장용 기성 장바구니.",
      basePrice: 3900,
      sortOrder: 110,
      isFeatured: true,
      isNew: false,
      categoryId: categories["shopping-bag"].id,
      stockQuantity: 60,
    },
    {
      slug: "ready-shopping-compact",
      builderType: "shopping-bag",
      name: "기성 장바구니 컴팩트",
      shortDesc: "가벼운 일상용",
      description: "가벼운 데일리 장바구니 기성품.",
      basePrice: 3500,
      sortOrder: 111,
      isFeatured: false,
      isNew: true,
      categoryId: categories["shopping-bag"].id,
      stockQuantity: 95,
    },
    {
      slug: "ready-pouch-zip",
      builderType: "pouch",
      name: "기성 지퍼 파우치",
      shortDesc: "단색 · 바로 구매",
      description: "무지 지퍼 파우치 기성품.",
      basePrice: 2800,
      sortOrder: 120,
      isFeatured: true,
      isNew: false,
      categoryId: categories.pouch.id,
      stockQuantity: 200,
    },
    {
      slug: "ready-pouch-set",
      builderType: "pouch",
      name: "기성 파우치 3종 세트",
      shortDesc: "S/M/L 세트",
      description: "사이즈별 3종 파우치 세트 기성품.",
      basePrice: 7900,
      sortOrder: 121,
      isFeatured: true,
      isNew: true,
      categoryId: categories.pouch.id,
      stockQuantity: 40,
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

  // ── 에코백 빌더 목업 면 (관리자가 수정한 구성은 덮어쓰지 않음) ──
  const ecobagMockups = [
    {
      side: "front",
      label: "앞면",
      imageUrl: "/mockups/ecobag-front-removebg-preview.png",
      imageWidth: 394,
      imageHeight: 526,
      printX: 0.1,
      printY: 0.3,
      printW: 0.8,
      printH: 0.62,
      sortOrder: 0,
    },
    {
      side: "back",
      label: "뒷면",
      imageUrl: "/mockups/ecobag-back.png",
      imageWidth: 430,
      imageHeight: 548,
      printX: 0.1,
      printY: 0.3,
      printW: 0.8,
      printH: 0.62,
      sortOrder: 1,
    },
    {
      side: "side",
      label: "측면",
      imageUrl: "/mockups/ecobag-front-removebg-preview.png",
      imageWidth: 394,
      imageHeight: 526,
      printX: 0.2,
      printY: 0.35,
      printW: 0.55,
      printH: 0.45,
      sortOrder: 2,
    },
  ];

  const existingMockupCount = await prisma.productMockupFace.count({
    where: { productId: products.ecobag.id },
  });
  if (existingMockupCount === 0) {
    await prisma.productMockupFace.createMany({
      data: ecobagMockups.map((face) => ({
        productId: products.ecobag.id,
        ...face,
      })),
    });
  }

  // 동일 builderType 커스텀 상품에 목업이 없으면 기준 상품에서 복제
  const mockupSourceByType: Record<string, string> = {
    ecobag: "ecobag",
    "shopping-bag": "shopping-bag",
    pouch: "pouch",
  };
  for (const p of productDefs) {
    const sourceSlug = mockupSourceByType[p.builderType];
    if (!sourceSlug || p.slug === sourceSlug) continue;
    const sourceId = products[sourceSlug]?.id;
    const targetId = products[p.slug]?.id;
    if (!sourceId || !targetId) continue;
    const targetCount = await prisma.productMockupFace.count({
      where: { productId: targetId },
    });
    if (targetCount > 0) continue;
    const sourceFaces = await prisma.productMockupFace.findMany({
      where: { productId: sourceId },
    });
    if (sourceFaces.length === 0) continue;
    await prisma.productMockupFace.createMany({
      data: sourceFaces.map((face) => ({
        productId: targetId,
        side: face.side,
        label: face.label,
        imageUrl: face.imageUrl,
        imageWidth: face.imageWidth,
        imageHeight: face.imageHeight,
        printX: face.printX,
        printY: face.printY,
        printW: face.printW,
        printH: face.printH,
        sortOrder: face.sortOrder,
      })),
    });
  }

  // ── 수량별 할인 ──
  const discountRules = [
    { slug: "ecobag", minQuantity: 100, unitPrice: 3800, label: "100개 이상 3,800원" },
    { slug: "ecobag", minQuantity: 500, unitPrice: 3200, label: "500개 이상 3,200원" },
    { slug: "shopping-bag", minQuantity: 2000, unitPrice: 2100, label: "2,000개 이상 2,100원" },
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
            "shopping-bag-wide",
            "pouch-flat",
            "ready-ecobag-basic",
            "ready-pouch-zip",
          ]
        : col.slug === "new"
          ? [
              "ecobag-cross",
              "ecobag-mini",
              "shopping-bag-fold",
              "pouch",
              "pouch-flat",
              "ready-ecobag-navy",
              "ready-shopping-compact",
              "ready-pouch-set",
            ]
          : col.slug === "trending"
            ? [
                "ecobag",
                "ecobag-round",
                "shopping-bag",
                "pouch-cube",
                "ready-shopping-mart",
              ]
            : ["ecobag", "shopping-bag", "pouch", "ecobag-mini"];

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
      tag: "CUSTOM GOODS STUDIO",
      title: "당신의 상상이\n현실이 되는 곳",
      subtitle:
        "나만의 디자인으로 만드는 특별한 굿즈 쇼핑몰.\n상상을 현실로 만들어보세요.",
      linkUrl: "/products/ecobag",
      imageUrl: "/images/final_banner_with_printing_detail.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "원하는 모양 그대로\n에코백 만들기",
      subtitle: "본체와 끈 색을 골라, 나만의 디자인을 한 개부터 제작하세요.",
      linkUrl: "/products/ecobag",
      imageUrl: "/images/banner2.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "나만의 패턴,\n지퍼 파우치",
      subtitle: "원하는 디자인을 담아, 들고 다니기 좋은 소형 굿즈.",
      linkUrl: "/products/pouch",
      imageUrl: "/images/banner3.png",
      sortOrder: 2,
    },
  ];

  await prisma.banner.deleteMany({ where: { placement: "HOME_HERO" } });
  for (const b of banners) {
    await prisma.banner.create({
      data: { ...b, placement: "HOME_HERO", isActive: true },
    });
  }

  const ideaBanners = [
    {
      tag: null,
      title: "커플 에코백",
      subtitle: "우정 · 커플 굿즈",
      linkUrl: "/ideas/couple-ecobag",
      imageUrl: "/images/couple_ecobag.png",
      sortOrder: 0,
    },
    {
      tag: null,
      title: "집꾸미기",
      subtitle: "파우치 · 수납",
      linkUrl: "/ideas/home-deco",
      imageUrl: "/images/house.png",
      sortOrder: 1,
    },
    {
      tag: null,
      title: "여행 필수템",
      subtitle: "에코백 · 장바구니",
      linkUrl: "/ideas/travel-essentials",
      imageUrl: "/images/trip.png",
      sortOrder: 2,
    },
    {
      tag: null,
      title: "반려동물 산책",
      subtitle: "산책용 파우치",
      linkUrl: "/ideas/pet-walk",
      imageUrl: "/images/pet.png",
      sortOrder: 3,
    },
    {
      tag: null,
      title: "마켓·플리마켓",
      subtitle: "장바구니 대량",
      linkUrl: "/ideas/flea-market",
      imageUrl: "/images/market.png",
      sortOrder: 4,
    },
    {
      tag: null,
      title: "기업 웰컴 키트",
      subtitle: "브랜드 맞춤",
      linkUrl: "/ideas/welcome-kit",
      imageUrl: "/images/company.png",
      sortOrder: 5,
    },
    {
      tag: null,
      title: "팬미팅 굿즈",
      subtitle: "최애 굿즈 제작",
      linkUrl: "/ideas/fan-meeting",
      imageUrl: "/images/goods.png",
      sortOrder: 6,
    },
    {
      tag: null,
      title: "카페 오픈 기념",
      subtitle: "에코백 + 파우치",
      linkUrl: "/ideas/cafe-opening",
      imageUrl: "/images/coffee.png",
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
      title: "에코백 제작 완벽 가이드",
      subtitle: "사이즈·원단·인쇄면 선택부터 제작 주의사항까지",
      linkUrl: "/guides/ecobag-guide",
      imageUrl: null,
      sortOrder: 0,
    },
    {
      tag: null,
      title: "F&B 브랜드 굿즈 제작 사례",
      subtitle: "카페·베이커리 에코백 제작 사례와 수량별 가격",
      linkUrl: "/guides/fnb-goods",
      imageUrl: null,
      sortOrder: 1,
    },
    {
      tag: null,
      title: "단체 행사 장바구니 제작",
      subtitle: "마켓·축제용 장바구니 1개부터 대량 제작",
      linkUrl: "/guides/event-shopping-bag",
      imageUrl: null,
      sortOrder: 2,
    },
    {
      tag: null,
      title: "이미지 해상도 가이드",
      subtitle: "선명한 인쇄를 위한 이미지 준비 꿀팁",
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
      title: "문구만 바꾸면 완성! 사각 에코백 만들기",
      description: "에코백에 텍스트를 넣어 2분 만에 제작해 보세요.",
      sortOrder: 0,
    },
    {
      productSlug: "shopping-bag",
      title: "로고·이미지 업로드! 장바구니 만들기",
      description: "PNG, JPG를 올려 나만의 굿즈를 완성하세요.",
      sortOrder: 1,
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
      title: "나만의 에코백, 손쉽게 완성",
      body: "캔버스·면 원단 에코백에 로고와 문구를 담아 보세요.\n브랜드 굿즈, 팬 굿즈, 행사 기념품까지 1개부터 제작할 수 있어요.\n앞·뒤·측면 인쇄로 나만의 디자인을 자유롭게 표현해 보세요.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "STORY",
      title: "3분이면 나만의 굿즈 완성",
      body: "어렵지 않아요!\n원하는 면을 선택하고 이미지·텍스트를 배치한 뒤 주문만 하면 됩니다.\n수량별 할인으로 대량 제작도 부담 없이 진행할 수 있어요.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 본품 1개\n• 제조국: Made in Korea\n• 소재: 면·캔버스 혼방\n• 인쇄: 전사 인쇄 (앞·뒤·측면)\n• 최소 주문: 1개\n• 평균 제작 기간: 주문 후 3~5영업일",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | S | M | L |\n| --- | --- | --- | --- |\n| 가로 (cm) | 28 | 32 | 38 |\n| 세로 (cm) | 30 | 34 | 40 |\n| 손잡이 (cm) | 25 | 28 | 30 |",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "디자인 파일 준비",
      body: "• PNG, JPG 파일을 업로드할 수 있어요.\n• 인쇄 영역에 맞게 2,000px 이상 해상도를 권장합니다.\n• 작은 원본을 무리하게 확대하면 인쇄 시 화질이 깨질 수 있어요.\n• 흰색 배경·흰색 글자는 원단 색과 겹쳐 인쇄가 잘 보이지 않을 수 있습니다.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "GUIDE",
      title: "인쇄 유의 사항",
      body: "• 모니터·기기에 따라 실제 인쇄 색상과 차이가 있을 수 있습니다.\n• 원단 특성상 색감이 약간 연하게 표현될 수 있으니 보정 후 업로드하세요.\n• 인쇄 위치·크기는 수작업 특성상 ±5mm 오차가 발생할 수 있습니다.",
      sortOrder: 1,
    },
    {
      slug: "ecobag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "저작권이 있는 이미지를 사용할 수 있나요?",
          a: "저작권자의 허락이 있거나, 본인이 직접 제작한 이미지·공개 라이선스 이미지만 사용 가능합니다.",
        },
        {
          q: "배경 제거가 가능한가요?",
          a: "주문 시 작업 요청란에 배경 제거를 요청해 주시면 검토 후 안내드립니다.",
        },
        {
          q: "대량 주문 시 할인이 있나요?",
          a: "수량별 할인표를 확인해 주세요. 100개·500개 이상 구간에서 단가가 내려갑니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 100% 주문 제작 상품으로, 결제 완료 후 제작이 시작됩니다.\n• 평균 제작 기간: 3~5영업일 (대량 주문 시 7~10영업일)\n• 출고 후 택배 수령: 영업일 기준 1~2일\n• 배송비: 3,000원 (5만원 이상 무료배송 예정)\n• 제작 준비 중 상태에서만 주문 변경·취소가 가능합니다.",
      sortOrder: 0,
    },
    {
      slug: "ecobag",
      type: "CAUTION",
      title: "주의사항",
      body: "• 주문 제작 상품은 단순 변심 교환·환불이 제한될 수 있습니다.\n• 디자인 시안과 실제 인쇄 색상·위치 차이는 교환 사유에 해당하지 않을 수 있습니다.\n• 세탁 시 단독 손세탁을 권장하며, 직사광선·고온 건조는 피해 주세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "STORY",
      title: "행사·마켓에 딱 맞는 장바구니",
      body: "플리마켓, 축제, 기업 행사에 어울리는 장바구니입니다.\n로고와 슬로건을 담아 브랜드 홍보와 실용성을 동시에 챙겨 보세요.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 본품 1개\n• 제조국: Made in Korea\n• 소재: 폴리에스테르\n• 인쇄: 전사 인쇄\n• 최소 주문: 1개",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | ONE |\n| --- | --- |\n| 가로 (cm) | 35 |\n| 세로 (cm) | 40 |\n| 손잡이 (cm) | 30 |",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 로고는 PNG(투명 배경) 업로드를 권장합니다.\n• 텍스트는 굵은 서체가 인쇄 후 가독성이 좋습니다.\n• 양면 다른 디자인도 가능합니다.",
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "몇 개부터 주문할 수 있나요?",
          a: "1개부터 주문 가능하며, 대량 주문 시 별도 견적을 요청하실 수 있습니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "shopping-bag",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 제작 완료 후 순차 출고됩니다.\n• 대량 주문은 제작 일정을 사전에 안내드립니다.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "STORY",
      title: "손안에 쏙, 나만의 파우치",
      body: "팬미팅·이벤트 굿즈로 인기 있는 지퍼형 파우치입니다.\n3면 인쇄로 캐릭터와 문구를 담아 보세요.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "INFO",
      title: "상품 정보",
      body: "• 구성: 지퍼 파우치 1개\n• 소재: 폴리에스테르\n• 인쇄: 전사 인쇄 (앞·뒤·측면)",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SIZE",
      title: "사이즈 정보",
      body: "| 항목 | ONE |\n| --- | --- |\n| 가로 (cm) | 18 |\n| 세로 (cm) | 12 |",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "GUIDE",
      title: "제작 가이드",
      body: "• 작은 인쇄 영역이므로 단순한 로고·짧은 문구가 잘 어울립니다.\n• 고해상도 이미지를 권장합니다.",
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "FAQ",
      title: "자주 묻는 질문",
      body: JSON.stringify([
        {
          q: "지퍼 색상을 선택할 수 있나요?",
          a: "현재 기본 색상으로 제공되며, 추후 옵션 확대 예정입니다.",
        },
      ]),
      sortOrder: 0,
    },
    {
      slug: "pouch",
      type: "SHIPPING",
      title: "배송 안내",
      body: "• 소형 상품으로 빠른 제작·출고가 가능합니다.\n• 평균 3~5영업일 내 출고됩니다.",
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
    const reviewSamples = [
      {
        slug: "ecobag",
        rating: 5,
        content:
          "색감이 예쁘게 나왔고 배송도 빨라서 만족합니다. 대량 주문도 문의했는데 친절하게 안내해 주셨어요!",
        isHot: true,
      },
      {
        slug: "ecobag",
        rating: 5,
        content: "로고 위치 걱정했는데 생각보다 깔끔하게 잘 나왔습니다. 재주문 의사 있어요.",
        isHot: false,
      },
      {
        slug: "shopping-bag",
        rating: 5,
        content: "행사용으로 200개 주문했는데 퀄리티 좋고 가격도 합리적이었습니다.",
        isHot: true,
      },
      {
        slug: "pouch",
        rating: 4,
        content: "귀엽게 잘 나왔어요. 인쇄 색은 조금 연하게 나오니 보정해서 올리시면 좋을 것 같아요.",
        isHot: false,
      },
    ];

    for (const rev of reviewSamples) {
      const productId = products[rev.slug].id;
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

  console.log("");
  console.log("=== 시드 완료 ===");
  console.log(
    "카테고리, 상품, 컬렉션, 배너, 소개글, 할인규칙, 템플릿, 계정",
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
