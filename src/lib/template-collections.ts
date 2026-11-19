import type { ProductType } from "@/types/builder";

export type TemplateCollectionItem = {
  productSlug: string;
  caption?: string;
};

export type TemplateCollection = {
  id: string;
  /** /ideas/[slug] 소개글 (없으면 title 사용) */
  ideaSlug: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  items: TemplateCollectionItem[];
};

/**
 * 2분컷 전체 보기 — 단가표 품번(toms-*) 기준
 */
export const TEMPLATE_COLLECTIONS: TemplateCollection[] = [
  {
    id: "club-tee",
    ideaSlug: "couple-ecobag",
    title: "동아리·행사 반팔티, 2분 컷",
    subtitle: "베이직·드라이 라운드로 로고·슬로건만 맞추세요",
    coverImageUrl: "/images/idea1.png",
    items: [
      { productSlug: "toms-085-cvt", caption: "085-CVT 베이직" },
      { productSlug: "toms-087-oet", caption: "087-OET 리브" },
      { productSlug: "toms-300-act", caption: "300-ACT 드라이" },
    ],
  },
  {
    id: "staff-polo",
    ideaSlug: "cafe-opening",
    title: "매장·현장 스태프 폴로",
    subtitle: "카라티 품번으로 유니폼 나염",
    coverImageUrl: "/images/idea8.png",
    items: [
      { productSlug: "toms-302-adp", caption: "302-ADP" },
      { productSlug: "toms-141-nvp", caption: "141-NVP T/C" },
      { productSlug: "toms-330-avp", caption: "330-AVP" },
    ],
  },
  {
    id: "sweat-hood",
    ideaSlug: "home-deco",
    title: "동아리·굿즈 맨투맨·후드",
    subtitle: "쮸리·기모 라인 품번",
    coverImageUrl: "/images/idea2.png",
    items: [
      { productSlug: "toms-210-nac", caption: "210-NAC MTM" },
      { productSlug: "toms-216-mlh", caption: "216-MLH 후드" },
      { productSlug: "toms-273-bfz", caption: "273-BFZ 집업" },
    ],
  },
  {
    id: "event-goods",
    ideaSlug: "flea-market",
    title: "행사 굿즈·잡화",
    subtitle: "에코백·캡·플리스 자켓",
    coverImageUrl: "/images/idea5.png",
    items: [
      { productSlug: "toms-778-tcc", caption: "778-TCC 에코백" },
      { productSlug: "toms-731-cck", caption: "731-CCK 볼캡" },
      { productSlug: "toms-238-rfj", caption: "238-RFJ 자켓" },
    ],
  },
  {
    id: "summer-dry",
    ideaSlug: "travel-essentials",
    title: "여름 MT·체육대회 드라이",
    subtitle: "드라이메쉬·인터록 품번",
    coverImageUrl: "/images/idea3.png",
    items: [
      { productSlug: "toms-350-ait", caption: "350-AIT 라이트" },
      { productSlug: "toms-304-alt", caption: "304-ALT 긴팔" },
      { productSlug: "toms-338-amz", caption: "338-AMZ 집업" },
    ],
  },
  {
    id: "corp-uniform",
    ideaSlug: "welcome-kit",
    title: "기업·단체 유니폼 세트",
    subtitle: "반팔 + 폴로 + 맨투맨 조합",
    coverImageUrl: "/images/idea6.png",
    items: [
      { productSlug: "toms-086-dmt", caption: "086-DMT" },
      { productSlug: "toms-313-abn", caption: "313-ABN" },
      { productSlug: "toms-219-mlc", caption: "219-MLC" },
    ],
  },
];

export type TemplateProductCard = {
  slug: string;
  name: string;
  shortDesc: string | null;
  basePrice: number;
  productType: ProductType;
  thumbnailUrl: string | null;
  caption?: string;
};
