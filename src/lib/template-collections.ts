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
    title: "우정 · 커플 단체티, 템플릿으로 쉽게",
    subtitle: "이니셜·날짜만 넣으면 바로 완성되는 나염 반팔",
    coverImageUrl: "/images/idea1.png",
    items: [
      { productSlug: "ecobag", caption: "17수 라운드" },
      { productSlug: "ecobag-round", caption: "기능성 반팔" },
      { productSlug: "ecobag-mini", caption: "아동용" },
    ],
  },
  {
    id: "travel",
    ideaSlug: "travel-essentials",
    title: "MT · 여행 단체티, 2분 만에 만들기",
    subtitle: "기능성 반팔부터 키즈 사이즈까지",
    coverImageUrl: "/images/idea3.png",
    items: [
      { productSlug: "ecobag-round", caption: "기능성 반팔" },
      { productSlug: "ecobag", caption: "17수 라운드" },
      { productSlug: "ecobag-mini", caption: "아동용" },
    ],
  },
  {
    id: "cafe",
    ideaSlug: "cafe-opening",
    title: "카페 · 매장 스태프 유니폼",
    subtitle: "상호만 올리면 카라티 유니폼 완성",
    coverImageUrl: "/images/idea8.png",
    items: [
      { productSlug: "shopping-bag", caption: "쿨론 카라티" },
      { productSlug: "ecobag", caption: "17수 라운드" },
      { productSlug: "pouch-cube", caption: "후드집업" },
    ],
  },
  {
    id: "pet",
    ideaSlug: "pet-walk",
    title: "가족 · 키즈 단체티 만들기",
    subtitle: "아동 사이즈와 성인 라운드를 같은 시안으로",
    coverImageUrl: "/images/idea4.png",
    items: [
      { productSlug: "ecobag-mini", caption: "아동용 쿨론" },
      { productSlug: "ecobag", caption: "성인 라운드" },
      { productSlug: "ecobag-round", caption: "기능성" },
    ],
  },
  {
    id: "market",
    ideaSlug: "flea-market",
    title: "체육대회 · 축제 단체티",
    subtitle: "행사명·날짜를 넣어 대량 나염",
    coverImageUrl: "/images/idea5.png",
    items: [
      { productSlug: "ecobag", caption: "17수 라운드" },
      { productSlug: "ecobag-round", caption: "기능성" },
      { productSlug: "shopping-bag", caption: "스태프 카라티" },
    ],
  },
  {
    id: "welcome",
    ideaSlug: "welcome-kit",
    title: "기업 유니폼, 템플릿으로 빠르게",
    subtitle: "로고 반팔 + 카라티로 워크샵·입사 키트",
    coverImageUrl: "/images/idea6.png",
    items: [
      { productSlug: "ecobag", caption: "라운드 본 행사" },
      { productSlug: "shopping-bag-wide", caption: "20수 카라티" },
      { productSlug: "pouch-flat", caption: "맨투맨" },
    ],
  },
  {
    id: "fan",
    ideaSlug: "fan-meeting",
    title: "팬미팅 · 생일카페 슬로건티",
    subtitle: "슬로건·날짜만 넣어 현장 배포용으로",
    coverImageUrl: "/images/idea7.png",
    items: [
      { productSlug: "ecobag", caption: "배포 라운드" },
      { productSlug: "pouch", caption: "후드티" },
      { productSlug: "pouch-flat", caption: "맨투맨" },
    ],
  },
  {
    id: "home",
    ideaSlug: "home-deco",
    title: "동아리 후드 · 맨투맨",
    subtitle: "기수 문구만 바꿔도 단체복이 됩니다",
    coverImageUrl: "/images/idea2.png",
    items: [
      { productSlug: "pouch", caption: "특양면 후드" },
      { productSlug: "pouch-flat", caption: "라이트 맨투맨" },
      { productSlug: "pouch-cube", caption: "후드집업" },
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
