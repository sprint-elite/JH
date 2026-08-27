import type { BagColorOption } from "@/types/builder";

export type BagColorPreset = {
  id: BagColorOption;
  hex: string;
  label: string;
  /** 크림 = 원본 유지 */
  isNatural?: boolean;
  blendMode: "color" | "multiply" | "soft-light";
  opacity: number;
};

export const BAG_COLOR_PRESETS: BagColorPreset[] = [
  { id: "cream", hex: "#f5f0e6", label: "크림", isNatural: true, blendMode: "color", opacity: 0 },
  { id: "white", hex: "#ece8e0", label: "화이트", blendMode: "color", opacity: 0.55 },
  { id: "ivory", hex: "#f5f0dc", label: "아이보리", blendMode: "soft-light", opacity: 0.7 },
  { id: "beige", hex: "#b8a078", label: "베이지", blendMode: "color", opacity: 0.82 },
  { id: "pink", hex: "#e07088", label: "핑크", blendMode: "color", opacity: 0.72 },
  { id: "sky", hex: "#4a9cc4", label: "스카이", blendMode: "color", opacity: 0.88 },
  { id: "mint", hex: "#5aad88", label: "민트", blendMode: "color", opacity: 0.85 },
  { id: "yellow", hex: "#c9a820", label: "옐로우", blendMode: "color", opacity: 0.82 },
  { id: "navy", hex: "#1a2848", label: "네이비", blendMode: "multiply", opacity: 0.72 },
  { id: "black", hex: "#141414", label: "블랙", blendMode: "multiply", opacity: 0.95 },
];

export function getBagColorPreset(id: BagColorOption): BagColorPreset {
  return BAG_COLOR_PRESETS.find((c) => c.id === id) ?? BAG_COLOR_PRESETS[0];
}

export function getBagColorTint(id: BagColorOption) {
  const preset = getBagColorPreset(id);
  if (preset.isNatural) return null;
  return {
    backgroundColor: preset.hex,
    mixBlendMode: preset.blendMode,
    opacity: preset.opacity,
  };
}
