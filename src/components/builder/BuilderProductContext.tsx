"use client";

import { createContext, useContext } from "react";
import type { ProductOptionSchema } from "@/lib/product-option-schema";
import type { ProductMockupFaceDto } from "@/lib/product-mockup";

export type BuilderProductContextValue = {
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  shortDesc: string | null;
  basePrice: number;
  ratingAvg: number;
  reviewCount: number;
  bulkLabel: string | null;
  minQuantity: number;
  maxQuantity: number;
  quantityDiscounts: Array<{
    minQuantity: number;
    unitPrice: number | null;
    discountRate: number | null;
    label: string | null;
  }>;
  optionSchema: ProductOptionSchema | null;
  mockupFaces: ProductMockupFaceDto[];
};

const BuilderProductContext = createContext<BuilderProductContextValue | null>(
  null,
);

export function BuilderProductProvider({
  value,
  children,
}: {
  value: BuilderProductContextValue | null;
  children: React.ReactNode;
}) {
  return (
    <BuilderProductContext.Provider value={value}>
      {children}
    </BuilderProductContext.Provider>
  );
}

export function useBuilderProduct() {
  return useContext(BuilderProductContext);
}
