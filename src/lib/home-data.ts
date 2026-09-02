import type { ProductType } from "@/types/builder";
import { PRODUCT_TYPE_LABELS } from "@/types/builder";

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
    subtitle: "Best 후기 바로 보러가기 · 에코백부터 파우치까지",
    thumbTitle: "요즘은 이렇게 커스텀해요",
    thumbSub: "Best 후기 바로 보러가기",
    cta: "에코백 커스텀하기",
    href: "/products/ecobag",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    productType: "ecobag" as ProductType,
    productColor: "mint",
  },
  {
    id: "2",
    tag: "HOT",
    title: "원하는 모양 그대로 에코백 만들기",
    subtitle: "문구·이미지를 넣고 1개부터 제작해 보세요",
    thumbTitle: "에코백 커스텀",
    thumbSub: "노트북부터 캐리어까지",
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
    subtitle: "장바구니·파우치 모아보기 · 부담 없이 제작할 수 있어요",
    thumbTitle: "여름 행사 굿즈",
    thumbSub: "3100원부터",
    cta: "상품 둘러보기",
    href: "#products",
    gradient: "from-orange-400 via-rose-500 to-pink-600",
    productType: "shopping-bag" as ProductType,
    productColor: "cream",
  },
  {
    id: "4",
    tag: "SALE",
    title: "가성비 최고! 단체 에코백 추천",
    subtitle: "요즘 많이 찾는 단체 굿즈 모아보기",
    thumbTitle: "단체 에코백",
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
    subtitle: "이미지 업로드로 1개부터 제작 가능해요",
    thumbTitle: "팬 굿즈",
    thumbSub: "파우치 · 에코백",
    cta: "디자인 시작",
    href: "/builder?product=pouch",
    gradient: "from-pink-400 via-rose-400 to-red-500",
    productType: "pouch" as ProductType,
    productColor: "pink",
  },
  {
    id: "6",
    tag: "TIP",
    title: "기업 맞춤 웰컴 키트",
    subtitle: "브랜드 컬러·로고를 담은 에코백 대량 제작",
    thumbTitle: "기업 맞춤",
    thumbSub: "웰컴 키트",
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
    subtitle: "에코백 찌라시 만들기",
    description: "최애 영업용 문구를 1분 만에 만들어 보세요.",
    productName: "사각 에코백",
    priceFrom: 3500,
    href: "/products/ecobag",
    productType: "ecobag" as ProductType,
    productColor: "mint",
  },
  {
    id: "logo",
    title: "우정 에코백, 템플릿으로 쉽게",
    subtitle: "친구와 맞추는 우정 굿즈",
    description: "사진만 넣으면 완성됩니다.",
    productName: "사각 에코백 M",
    priceFrom: 4000,
    href: "/products/ecobag",
    productType: "ecobag" as ProductType,
    productColor: "pink",
  },
  {
    id: "group",
    title: "단체 행사용 장바구니",
    subtitle: "마켓·플리마켓 추천",
    description: "우리 팀만의 단체 장바구니를 빠르게 만들어 보세요.",
    productName: "장바구니",
    priceFrom: 2800,
    href: "/products/shopping-bag",
    productType: "shopping-bag" as ProductType,
    productColor: "cream",
  },
] as const;

export const SHOWCASE_BEST: ShowcaseItem[] = [
  {
    id: "b1",
    name: "사각 에코백 (기본)",
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
    name: "장바구니 (중형)",
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
    name: "파우치 (기본)",
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
    name: "에코백 M · 캔버스",
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
    name: "에코백 L · 면20수",
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
    name: "장바구니 L · 비닐손잡이",
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
    name: "파우치 · 지퍼형",
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
    name: "에코백 S · 무지",
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
    name: "에코백 · 앞뒤 인쇄",
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
    name: "장바구니 · 대량 제작",
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
    name: "파우치 · 3면 인쇄",
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
    name: "에코백 · 기업 로고",
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
export const SHOW_HOME_REVIEWS_SECTION = false;

/** 신상품·트렌딩 섹션 표시 */
export const SHOW_HOME_NEW_AND_TRENDING_SECTIONS = false;

export const REVIEWS = [
  {
    id: "1",
    user: "call***",
    date: "2026.06.19",
    product: "사각 에코백 M",
    productType: "ecobag" as ProductType,
    productColor: "mint",
    rating: 5,
    text: "디자인이 생각보다 훨씬 선명하게 나왔어요. 주문 후 코멘트로 진행 상황도 바로 확인할 수 있어서 좋았습니다.",
    hot: true,
    category: "에코백",
  },
  {
    id: "2",
    user: "juju***",
    date: "2026.06.19",
    product: "장바구니 L",
    productType: "shopping-bag" as ProductType,
    productColor: "cream",
    rating: 5,
    text: "행사용으로 50개 주문했는데 옵션 선택부터 수량 견적까지 한 화면에서 끝나서 편했어요.",
    hot: true,
    category: "장바구니",
  },
  {
    id: "3",
    user: "kcl7***",
    date: "2026.06.19",
    product: "파우치",
    productType: "pouch" as ProductType,
    productColor: "sky",
    rating: 5,
    text: "이미지 해상도 걱정했는데 원본 보내니 퀄리티가 정말 좋게 나왔습니다. 재주문 예정이에요!",
    hot: true,
    category: "파우치",
  },
  {
    id: "4",
    user: "gjfu**",
    date: "2026.06.19",
    product: "에코백 M",
    productType: "ecobag" as ProductType,
    productColor: "navy",
    rating: 5,
    text: "빌더에서 앞뒤 면 전환하면서 디자인할 수 있는 점이 특히 마음에 들었어요.",
    hot: true,
    category: "에코백",
  },
  {
    id: "5",
    user: "juju***",
    date: "2026.06.19",
    product: "에코백 L",
    productType: "ecobag" as ProductType,
    productColor: "pink",
    rating: 5,
    text: "남편이 가족티를 싫어하는데 유치하지 않게 캠핑 컨셉으로 넣었더니 평소에도 너무 잘 들고 다녀요!",
    hot: true,
    category: "에코백",
  },
  {
    id: "6",
    user: "juju***",
    date: "2026.06.19",
    product: "장바구니",
    productType: "shopping-bag" as ProductType,
    productColor: "white",
    rating: 5,
    text: "마켓에서 판매용으로 제작했는데 고객들 반응이 정말 좋았어요. 또 주문할 예정입니다.",
    hot: true,
    category: "장바구니",
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
