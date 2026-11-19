import type { ProductType } from "@/types/builder";

export type HomeProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
  productType: ProductType;
};

export type ShowcaseItem = {
  id: string;
  name: string;
  brand: string;
  productType: ProductType;
  price: number;
  originalPrice?: number;
  discount?: number;
  bulkLabel?: string;
  rating: number;
  reviewCount: number;
  productColor: string;
  badge?: string;
  href: string;
};

export const SLUG_TO_PRODUCT_TYPE: Record<string, ProductType> = {
  ecobag: "ecobag",
  "shopping-bag": "shopping-bag",
  pouch: "pouch",
};

export function toHomeProduct(p: {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePrice: number;
}): HomeProduct {
  return {
    ...p,
    productType: SLUG_TO_PRODUCT_TYPE[p.slug] ?? "ecobag",
  };
}

export const HERO_BANNERS = [
  {
    id: "1",
    tag: "BEST",
    title: "요즘은 이렇게 커스텀해요",
    subtitle: "Best 후기 바로 보러가기 · 반팔티부터 후드까지",
    thumbTitle: "요즘은 이렇게 커스텀해요",
    thumbSub: "Best 후기 바로 보러가기",
    cta: "반팔티 커스텀하기",
    href: "/products/ecobag",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    productType: "ecobag" as ProductType,
    productColor: "mint",
  },
  {
    id: "2",
    tag: "HOT",
    title: "원하는 핏 그대로 반팔티 만들기",
    subtitle: "문구·이미지를 넣고 1장부터 제작해 보세요",
    thumbTitle: "반팔티 커스텀",
    thumbSub: "로고부터 슬로건까지",
    cta: "지금 만들기",
    href: "/products/ecobag",
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    productType: "ecobag" as ProductType,
    productColor: "sky",
  },
  {
    id: "3",
    tag: "NEW",
    title: "여름 행사 준비 끝!",
    subtitle: "카라티·후드 모아보기 · 부담 없이 제작할 수 있어요",
    thumbTitle: "여름 행사 단체티",
    thumbSub: "1장부터",
    cta: "상품 둘러보기",
    href: "#products",
    gradient: "from-orange-400 via-rose-500 to-pink-600",
    productType: "shopping-bag" as ProductType,
    productColor: "cream",
  },
  {
    id: "4",
    tag: "SALE",
    title: "가성비 최고! 단체 반팔티 추천",
    subtitle: "요즘 많이 찾는 단체티 모아보기",
    thumbTitle: "단체 반팔티",
    thumbSub: "수량별 할인",
    cta: "단체 제작하기",
    href: "/products/ecobag",
    gradient: "from-violet-500 via-purple-500 to-fuchsia-600",
    productType: "ecobag" as ProductType,
    productColor: "navy",
  },
  {
    id: "5",
    tag: "PICK",
    title: "최애로 완성하는 팬 굿즈",
    subtitle: "이미지 업로드로 1장부터 제작 가능해요",
    thumbTitle: "팬 굿즈",
    thumbSub: "후드 · 반팔티",
    cta: "디자인 시작",
    href: "/builder?product=pouch",
    gradient: "from-pink-400 via-rose-400 to-red-500",
    productType: "pouch" as ProductType,
    productColor: "pink",
  },
  {
    id: "6",
    tag: "TIP",
    title: "기업 맞춤 유니폼",
    subtitle: "브랜드 컬러·로고를 담은 단체티 대량 제작",
    thumbTitle: "기업 맞춤",
    thumbSub: "유니폼",
    cta: "상담 후 제작",
    href: "/builder",
    gradient: "from-zinc-700 via-zinc-800 to-zinc-900",
    productType: "ecobag" as ProductType,
    productColor: "white",
  },
] as const;

export const CATEGORY_CHIPS = [
  { label: "신상품", href: "#new", highlight: true },
  { label: "대지나염 베스트", href: "#products" },
  { label: "기업 유니폼", href: "/builder" },
  { label: "2분컷 템플릿", href: "/templates" },
  { label: "반팔티", href: "/products/list/tee" },
  { label: "카라티", href: "/products/list/polo" },
  { label: "기능성", href: "/products/list/functional" },
  { label: "긴팔티", href: "/products/list/long-sleeve" },
  { label: "후드/집업", href: "/products/list/hoodie" },
  { label: "맨투맨", href: "/products/list/sweatshirt" },
  { label: "아동단체", href: "/products/list/kids" },
  { label: "조끼", href: "/products/list/vest" },
  { label: "단체점퍼", href: "/products/list/jumper" },
  { label: "야구점퍼", href: "/products/list/baseball" },
  { label: "단체 제작", href: "/builder" },
  { label: "내 주문", href: "/mypage" },
] as const;

export const QUICK_TEMPLATES = [
  {
    id: "text",
    title: "문구만 바꾸면 완성!",
    subtitle: "반팔티 찌라시 만들기",
    description: "최애 영업용 문구를 1분 만에 만들어 보세요.",
    productName: "기본 반팔티",
    priceFrom: 3500,
    href: "/products/ecobag",
    productType: "ecobag" as ProductType,
    productColor: "mint",
  },
  {
    id: "logo",
    title: "우정 반팔티, 템플릿으로 쉽게",
    subtitle: "친구와 맞추는 우정 티",
    description: "사진만 넣으면 완성됩니다.",
    productName: "반팔티 M",
    priceFrom: 4000,
    href: "/products/ecobag",
    productType: "ecobag" as ProductType,
    productColor: "pink",
  },
  {
    id: "group",
    title: "단체 행사용 카라티",
    subtitle: "매장·행사 추천",
    description: "우리 팀만의 단체 카라티를 빠르게 만들어 보세요.",
    productName: "카라티",
    priceFrom: 2800,
    href: "/products/shopping-bag",
    productType: "shopping-bag" as ProductType,
    productColor: "cream",
  },
] as const;

export const SHOWCASE_BEST: ShowcaseItem[] = [
  {
    id: "b1",
    name: "반팔티 (기본)",
    brand: "대지나염",
    productType: "ecobag",
    price: 3500,
    rating: 4.97,
    reviewCount: 3148,
    productColor: "mint",
    href: "/products/ecobag",
  },
  {
    id: "b2",
    name: "카라티 (중형)",
    brand: "대지나염",
    productType: "shopping-bag",
    price: 2800,
    rating: 4.97,
    reviewCount: 1497,
    productColor: "cream",
    href: "/products/shopping-bag",
  },
  {
    id: "b3",
    name: "후드/집업 (기본)",
    brand: "대지나염",
    productType: "pouch",
    price: 2200,
    rating: 4.97,
    reviewCount: 674,
    productColor: "sky",
    href: "/builder?product=pouch",
  },
  {
    id: "b4",
    name: "반팔티 M · 면20수",
    brand: "대지나염",
    productType: "ecobag",
    price: 4500,
    originalPrice: 5500,
    discount: 18,
    bulkLabel: "100개 이상 3,800원",
    rating: 4.97,
    reviewCount: 370,
    productColor: "navy",
    badge: "할인",
    href: "/products/ecobag",
  },
  {
    id: "b5",
    name: "반팔티 L · 면17수",
    brand: "대지나염",
    productType: "ecobag",
    price: 4000,
    originalPrice: 4800,
    discount: 17,
    bulkLabel: "500개 이상 3,200원",
    rating: 4.99,
    reviewCount: 823,
    productColor: "cream",
    badge: "할인",
    href: "/products/ecobag",
  },
  {
    id: "b6",
    name: "카라티 L · 쿨론",
    brand: "대지나염",
    productType: "shopping-bag",
    price: 3200,
    rating: 4.95,
    reviewCount: 150,
    productColor: "white",
    href: "/products/shopping-bag",
  },
  {
    id: "b7",
    name: "후드 · 집업형",
    brand: "대지나염",
    productType: "pouch",
    price: 2900,
    rating: 4.88,
    reviewCount: 88,
    productColor: "pink",
    href: "/builder?product=pouch",
  },
  {
    id: "b8",
    name: "반팔티 S · 무지",
    brand: "대지나염",
    productType: "ecobag",
    price: 3500,
    rating: 5.0,
    reviewCount: 42,
    productColor: "mint",
    href: "/products/ecobag",
  },
  {
    id: "b9",
    name: "반팔티 · 앞뒤 인쇄",
    brand: "대지나염",
    productType: "ecobag",
    price: 5200,
    originalPrice: 6500,
    discount: 20,
    bulkLabel: "200개 이상 4,500원",
    rating: 4.88,
    reviewCount: 207,
    productColor: "sky",
    badge: "인기",
    href: "/products/ecobag",
  },
  {
    id: "b10",
    name: "카라티 · 대량 제작",
    brand: "대지나염",
    productType: "shopping-bag",
    price: 2500,
    originalPrice: 2800,
    discount: 11,
    bulkLabel: "2,000개 이상 2,100원",
    rating: 4.97,
    reviewCount: 593,
    productColor: "cream",
    badge: "할인",
    href: "/products/shopping-bag",
  },
  {
    id: "b11",
    name: "후드 · 앞뒤 인쇄",
    brand: "대지나염",
    productType: "pouch",
    price: 3500,
    rating: 4.95,
    reviewCount: 311,
    productColor: "navy",
    href: "/builder?product=pouch",
  },
  {
    id: "b12",
    name: "반팔티 · 기업 로고",
    brand: "대지나염",
    productType: "ecobag",
    price: 3800,
    rating: 4.97,
    reviewCount: 674,
    productColor: "white",
    href: "/products/ecobag",
  },
];

export const SHOWCASE_NEW = SHOWCASE_BEST.slice(0, 6).map((item, i) => ({
  ...item,
  id: `n${i}`,
  badge: "NEW" as const,
}));

export const SHOWCASE_TRENDING = [
  SHOWCASE_BEST[0],
  SHOWCASE_BEST[4],
  SHOWCASE_BEST[1],
  SHOWCASE_BEST[9],
  SHOWCASE_BEST[2],
  SHOWCASE_BEST[8],
  SHOWCASE_BEST[3],
  SHOWCASE_BEST[6],
];

const LIST_SLUG: Record<ProductType, string> = {
  ecobag: "tee",
  "shopping-bag": "polo",
  pouch: "hoodie",
};

/** 메인 — 하이퀄리티 라인업 (SHOWCASE_BEST 상위 8개) */
export const CURATED_PICKS = SHOWCASE_BEST.slice(0, 8).map((item) => ({
  id: item.id,
  slug: LIST_SLUG[item.productType],
  name: item.name,
  shortDesc: null as string | null,
  basePrice: item.price,
  thumbnailUrl: null as string | null,
  isNew: false,
  isFeatured: false,
  ratingAvg: item.rating,
  reviewCount: item.reviewCount,
  productType: item.productType,
  saleType: "CUSTOM" as const,
  categorySlug: LIST_SLUG[item.productType],
  categoryParentSlug: null as string | null,
  bulkLabel: item.bulkLabel ?? null,
  badge: item.badge ?? null,
  listHref: `/products/list/${LIST_SLUG[item.productType]}`,
}));

export type IdeaBanner = {
  title: string;
  subtitle: string;
  href: string;
  gradient: string;
  emoji: string;
  imageUrl?: string;
};

export const IDEA_BANNERS: IdeaBanner[] = [
  {
    title: "커플 · 우정 단체티",
    subtitle: "이니셜 · 날짜 나염",
    href: "/ideas/couple-ecobag",
    gradient: "from-pink-200 to-rose-100",
    emoji: "💕",
    imageUrl: "/images/idea1.png",
  },
  {
    title: "동아리 단체복",
    subtitle: "후드 · 맨투맨",
    href: "/ideas/home-deco",
    gradient: "from-amber-200 to-orange-100",
    emoji: "🏠",
    imageUrl: "/images/idea2.png",
  },
  {
    title: "MT · 여행 단체티",
    subtitle: "기능성 반팔",
    href: "/ideas/travel-essentials",
    gradient: "from-sky-200 to-blue-100",
    emoji: "✈️",
    imageUrl: "/images/idea3.png",
  },
  {
    title: "가족 · 키즈 단체티",
    subtitle: "아동 사이즈",
    href: "/ideas/pet-walk",
    gradient: "from-emerald-200 to-green-100",
    emoji: "🐕",
    imageUrl: "/images/idea4.png",
  },
  {
    title: "체육대회 · 축제",
    subtitle: "대량 나염",
    href: "/ideas/flea-market",
    gradient: "from-stone-200 to-zinc-100",
    emoji: "🛒",
    imageUrl: "/images/idea5.png",
  },
  {
    title: "기업 유니폼",
    subtitle: "워크샵 · 입사",
    href: "/ideas/welcome-kit",
    gradient: "from-zinc-200 to-slate-100",
    emoji: "🏢",
    imageUrl: "/images/idea6.png",
  },
  {
    title: "팬미팅 슬로건티",
    subtitle: "응원 · 생일카페",
    href: "/ideas/fan-meeting",
    gradient: "from-rose-100 to-orange-50",
    emoji: "⭐",
    imageUrl: "/images/idea7.png",
  },
  {
    title: "카페 스태프티",
    subtitle: "카라티 유니폼",
    href: "/ideas/cafe-opening",
    gradient: "from-yellow-100 to-amber-50",
    emoji: "☕",
    imageUrl: "/images/idea8.png",
  },
];

export const GUIDE_CARDS = [
  {
    id: "ecobag-guide",
    title: "단체티 제작 완벽 가이드",
    subtitle: "원단·사이즈·나염 도수부터 제작 주의사항까지",
    href: "/guides/ecobag-guide",
    gradient: "from-teal-100 to-emerald-50",
  },
  {
    id: "fnb-goods",
    title: "매장·카페 유니폼 제작 사례",
    subtitle: "카라티·스태프티 수량별 단가와 인쇄 팁",
    href: "/guides/fnb-goods",
    gradient: "from-orange-100 to-amber-50",
  },
  {
    id: "event-shopping-bag",
    title: "체육대회·행사 단체티 제작",
    subtitle: "학교·축제용 반팔티 대량 나염",
    href: "/guides/event-shopping-bag",
    gradient: "from-blue-100 to-sky-50",
  },
  {
    id: "print-resolution",
    title: "나염 인쇄 해상도 가이드",
    subtitle: "선명한 로고를 위한 파일 준비 꿀팁",
    href: "/guides/print-resolution",
    gradient: "from-stone-100 to-zinc-50",
  },
] as const;

/** 메인 리뷰 섹션·리뷰 링크 표시 */
export const SHOW_HOME_REVIEWS_SECTION = true;

/** 메인 「신상품」 섹션 표시 */
export const SHOW_HOME_NEW_SECTION = false;

/** 메인 「지금 많이 찾는」 섹션 표시 */
export const SHOW_HOME_TRENDING_SECTION = true;

export const REVIEWS = [
  {
    id: "1",
    user: "call***",
    date: "2026.03.12",
    product: "[085-CVT] 베이직 라운드 티셔츠",
    productSlug: "toms-085-cvt",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "동아리 단체티 120장 맞췄는데 가슴 로고 선명하고 납기도 지켜주셨어요.",
    hot: true,
    category: "티셔츠",
    href: "/products/toms-085-cvt",
  },
  {
    id: "2",
    user: "juju***",
    date: "2026.04.02",
    product: "[300-ACT] 드라이 라운드 티셔츠",
    productSlug: "toms-300-act",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "체육대회용 드라이 80장. 땀 많은 날에도 원단 반응이 좋았습니다.",
    hot: true,
    category: "드라이메쉬·인터록",
    href: "/products/toms-300-act",
  },
  {
    id: "3",
    user: "kcl7***",
    date: "2026.04.18",
    product: "[302-ADP] 드라이 폴로셔츠",
    productSlug: "toms-302-adp",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "매장 스태프 폴로 35장. 카라 나염 위치 맞춰 주셔서 유니폼으로 딱이에요.",
    hot: true,
    category: "폴로셔츠",
    href: "/products/toms-302-adp",
  },
  {
    id: "4",
    user: "gjfu**",
    date: "2026.05.06",
    product: "[210-NAC] T/C 쮸리 맨투맨",
    productSlug: "toms-210-nac",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "MT 맨투맨 50장. 등판 슬로건 크기 조절해 주셔서 사진 찍기 좋게 나왔어요.",
    hot: false,
    category: "스웨트",
    href: "/products/toms-210-nac",
  },
  {
    id: "5",
    user: "mina***",
    date: "2026.05.21",
    product: "[216-MLH] 코튼 쮸리 후드티",
    productSlug: "toms-216-mlh",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "졸업 기념 후드 30장. 오트밀 색 실물이 기대한 대로 왔습니다.",
    hot: true,
    category: "스웨트",
    href: "/products/toms-216-mlh",
  },
  {
    id: "6",
    user: "park***",
    date: "2026.06.01",
    product: "[778-TCC] 캔버스 에코백",
    productSlug: "toms-778-tcc",
    productType: "ecobag" as ProductType,
    productColor: "zinc",
    rating: 5,
    text: "행사 굿즈 에코백 200개. 로고 인쇄 흐림 없이 깔끔했습니다.",
    hot: true,
    category: "기타",
    href: "/products/toms-778-tcc",
  },
] as const;

export const PRODUCT_GRADIENTS: Record<ProductType, string> = {
  ecobag: "from-emerald-100 via-teal-50 to-cyan-50",
  "shopping-bag": "from-amber-100 via-orange-50 to-yellow-50",
  pouch: "from-violet-100 via-purple-50 to-fuchsia-50",
};

/** 메인·카드용 상품 썸네일 이미지 */
export const PRODUCT_DISPLAY_IMAGES: Partial<Record<ProductType, string>> = {
  ecobag: "/images/tee.png",
  "shopping-bag": "/images/polo.png",
  pouch: "/images/hoodie.png",
};

export const TRUST_STATS = [
  { value: "1,000+", label: "누적 제작" },
  { value: "4.97", label: "평균 만족도" },
  { value: "1개~", label: "최소 주문" },
  { value: "3~5일", label: "평균 제작" },
] as const;
