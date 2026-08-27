import type { Product } from "@/types";

export const mockProducts: Product[] = [
  {
    id: "prod-001",
    name: "커스텀 티셔츠",
    description: "원하는 디자인을 입힌 기본 라운드넥 티셔츠",
    basePrice: 25000,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    id: "prod-002",
    name: "에코백",
    description: "친환경 캔버스 소재 에코백",
    basePrice: 18000,
    thumbnailUrl: null,
    isActive: true,
  },
  {
    id: "prod-003",
    name: "머그컵",
    description: "열전사 인쇄 가능한 세라믹 머그컵",
    basePrice: 12000,
    thumbnailUrl: null,
    isActive: true,
  },
];
