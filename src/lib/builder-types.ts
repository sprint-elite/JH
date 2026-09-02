import type { ProductType } from "@/types/builder";

export const BUILDER_TYPES: { value: ProductType; label: string }[] = [
  { value: "ecobag", label: "반팔티 빌더" },
  { value: "shopping-bag", label: "카라티 빌더" },
  { value: "pouch", label: "후드/집업 빌더" },
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
