export const BANNER_PLACEMENTS = [
  { value: "HOME_HERO", label: "히어로" },
  { value: "HOME_CIRCLE", label: "원형 메뉴" },
  { value: "HOME_PROMO", label: "프로모" },
  { value: "HOME_IDEA", label: "아이디어" },
  { value: "HOME_GUIDE", label: "가이드" },
] as const;

export type BannerPlacementValue = (typeof BANNER_PLACEMENTS)[number]["value"];

export const BANNER_PLACEMENT_VALUES = new Set<string>(
  BANNER_PLACEMENTS.map((p) => p.value),
);

export function bannerPlacementLabel(value: string) {
  return BANNER_PLACEMENTS.find((p) => p.value === value)?.label ?? value;
}
