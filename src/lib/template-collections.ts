import type { ProductType } from "@/types/builder";

export type TemplateCollectionItem = {
  productSlug: string;
  caption?: string;
};

export type TemplateCollection = {
  id: string;
  /** /ideas/[slug] 소개글 */
  ideaSlug: string;
  title: string;
  subtitle: string;
  /** 큰 카드 커버 (없으면 idea cover 사용) */
  coverImageUrl: string;
  items: TemplateCollectionItem[];
};

/**
 * 마플 /template 그리드:
 * 큰 블록 → 상황별 소개글(/ideas/…)
 * 아래 소형 3개 → 상품 상세(/products/…)
 */
export const TEMPLATE_COLLECTIONS: TemplateCollection[] = [
  {
    id: "couple",
    ideaSlug: "couple-ecobag",
    title: "우정 · 커플 에코백, 템플릿으로 쉽게",
    subtitle: "이니셜·날짜만 넣으면 바로 완성되는 데일리 백",
    coverImageUrl: "/images/couple_ecobag.png",
    items: [
      { productSlug: "ecobag", caption: "사각 에코백" },
      { productSlug: "ecobag-round", caption: "라운드 에코백" },
      { productSlug: "ecobag-mini", caption: "미니 에코백" },
    ],
  },
  {
    id: "travel",
    ideaSlug: "travel-essentials",
    title: "여행 필수템, 2분 만에 만들기",
    subtitle: "기내용 미니부터 접이식 장바구니까지",
    coverImageUrl: "/images/trip.png",
    items: [
      { productSlug: "ecobag-mini", caption: "기내용 미니" },
      { productSlug: "shopping-bag-fold", caption: "접이식 장바구니" },
      { productSlug: "ecobag-cross", caption: "크로스 에코백" },
    ],
  },
  {
    id: "cafe",
    ideaSlug: "cafe-opening",
    title: "카페 · F&B 오픈 기념 굿즈",
    subtitle: "로고만 올리면 테이크아웃·리워드 굿즈 완성",
    coverImageUrl: "/images/coffee.png",
    items: [
      { productSlug: "ecobag", caption: "테이크아웃 백" },
      { productSlug: "ecobag-round", caption: "시즌 에코백" },
      { productSlug: "pouch", caption: "원두 · 키트 파우치" },
    ],
  },
  {
    id: "pet",
    ideaSlug: "pet-walk",
    title: "반려동물 산책 파우치 만들기",
    subtitle: "이름·실루엣만 넣으면 산책 필수템 완성",
    coverImageUrl: "/images/pet.png",
    items: [
      { productSlug: "pouch", caption: "기본 지퍼" },
      { productSlug: "pouch-flat", caption: "슬림 플랫" },
      { productSlug: "ecobag-mini", caption: "산책 미니백" },
    ],
  },
  {
    id: "market",
    ideaSlug: "flea-market",
    title: "플리마켓 · 행사 장바구니",
    subtitle: "부스 로고·행사명을 넣어 배포·판매용으로",
    coverImageUrl: "/images/market.png",
    items: [
      { productSlug: "shopping-bag", caption: "기본 장바구니" },
      { productSlug: "shopping-bag-wide", caption: "와이드" },
      { productSlug: "shopping-bag-fold", caption: "접이식" },
    ],
  },
  {
    id: "welcome",
    ideaSlug: "welcome-kit",
    title: "기업 웰컴 키트, 템플릿으로 빠르게",
    subtitle: "로고 에코백 + 파우치 세트로 첫인상 만들기",
    coverImageUrl: "/images/company.png",
    items: [
      { productSlug: "ecobag", caption: "메인 백" },
      { productSlug: "pouch-flat", caption: "키트 파우치" },
      { productSlug: "ecobag-mini", caption: "대량 배포용" },
    ],
  },
  {
    id: "fan",
    ideaSlug: "fan-meeting",
    title: "팬미팅 · 생일카페 배포 굿즈",
    subtitle: "슬로건·날짜만 넣어 현장 배포용으로",
    coverImageUrl: "/images/goods.png",
    items: [
      { productSlug: "ecobag-mini", caption: "배포용 미니" },
      { productSlug: "pouch", caption: "파우치" },
      { productSlug: "pouch-flat", caption: "플랫 파우치" },
    ],
  },
  {
    id: "home",
    ideaSlug: "home-deco",
    title: "집꾸미기 수납 파우치",
    subtitle: "라벨만 바꿔도 정리 굿즈가 됩니다",
    coverImageUrl: "/images/house.png",
    items: [
      { productSlug: "pouch-flat", caption: "슬림 수납" },
      { productSlug: "pouch-cube", caption: "큐브 수납" },
      { productSlug: "pouch", caption: "기본 지퍼" },
    ],
  },
];

export type TemplateProductCard = {
  slug: string;
  name: string;
  shortDesc: string | null;
  basePrice: number;
  productType: ProductType;
  caption?: string;
};
