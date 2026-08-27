import type { ProductType } from "@/types/builder";

export const BUILDER_TYPES: { value: ProductType; label: string }[] = [
  { value: "ecobag", label: "에코백 빌더" },
  { value: "shopping-bag", label: "장바구니 빌더" },
  { value: "pouch", label: "파우치 빌더" },
];

export const BUILDER_TYPE_SET = new Set<string>(
  BUILDER_TYPES.map((t) => t.value),
);

export function isBuilderType(value: string): value is ProductType {
  return BUILDER_TYPE_SET.has(value);
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 64);
}
