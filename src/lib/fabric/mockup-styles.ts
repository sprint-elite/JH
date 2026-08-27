import type {
  BuilderOptions,
  FabricOption,
  HandleOption,
  PocketOption,
  ProductType,
  ViewSide,
} from "@/types/builder";

export const FABRIC_COLORS: Record<FabricOption, string> = {
  cotton10: "#f5f0e6",
  cotton20: "#faf8f5",
  canvas: "#c9b896",
  nonwoven: "#d8d8d8",
};

export const HANDLE_COLORS: Record<HandleOption, string> = {
  basic: "#6b7280",
  long: "#4b5563",
  color: "#dc2626",
};

export const PRODUCT_SHAPE: Record<
  ProductType,
  { printWRatio: number; printHRatio: number; bodyPad: number }
> = {
  ecobag: { printWRatio: 0.55, printHRatio: 0.62, bodyPad: 28 },
  "shopping-bag": { printWRatio: 0.65, printHRatio: 0.5, bodyPad: 22 },
  pouch: { printWRatio: 0.42, printHRatio: 0.38, bodyPad: 18 },
};

export function getSideTint(side: ViewSide): string {
  if (side === "back") return "rgba(0,0,0,0.04)";
  if (side === "side") return "rgba(0,0,0,0.07)";
  return "rgba(255,255,255,0)";
}

export function getMockupSummary(options: BuilderOptions, side: ViewSide): string {
  const parts = [
    options.productType,
    options.size,
    options.fabric,
    side,
  ];
  return parts.join(" · ");
}
