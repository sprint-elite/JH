import type {
  BagColorOption,
  BagShapeOption,
  ClosureOption,
  FabricOption,
  HandleOption,
  PocketOption,
  PrintSideOption,
  SizeOption,
} from "@/types/builder";

export type ProductOptionSchema = {
  sizes?: SizeOption[];
  fabrics?: FabricOption[];
  colors?: BagColorOption[];
  handleStrapColors?: BagColorOption[];
  closureTypes?: ClosureOption[];
  bagShapes?: BagShapeOption[];
  handles?: HandleOption[];
  pockets?: PocketOption[];
  printSides?: PrintSideOption[];
  shippingFee?: number;
};

export function parseProductOptionSchema(
  raw: unknown,
): ProductOptionSchema | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as ProductOptionSchema;
}
