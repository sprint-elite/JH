/** 면 식별 키. DB 목업이 있으면 임의 문자열, 없으면 front/back/side */
export type ViewSide = string;

export type ProductType = "ecobag" | "shopping-bag" | "pouch";
export type SizeOption = "S" | "M" | "L";
export type FabricOption = "cotton10" | "cotton20" | "canvas" | "nonwoven";
export type BagColorOption =
  | "cream"
  | "white"
  | "ivory"
  | "beige"
  | "pink"
  | "sky"
  | "mint"
  | "yellow"
  | "navy"
  | "black";
export type HandleOption = "basic" | "long" | "color";
export type PocketOption = "none" | "inner" | "outer";
export type PrintSideOption = "front" | "front-back" | "front-back-side";
export type ClosureOption = "magnetic" | "snap" | "none";
export type BagShapeOption =
  | "bottom-base"
  | "band"
  | "plain"
  | "cross"
  | "cross-handle"
  | "side-stitch"
  | "side-width"
  | "cylinder"
  | "drawstring";

export type ApprovalStatus =
  | "DRAFT"
  | "REVISION_REQUESTED"
  | "WAITING_APPROVAL"
  | "APPROVED";

export type MockupOffset = { x: number; y: number };

export type MockupOffsetState = Record<string, MockupOffset>;

export const DEFAULT_MOCKUP_OFFSET: MockupOffsetState = {
  front: { x: 0, y: 0 },
  back: { x: 0, y: 0 },
  side: { x: 0, y: 0 },
};

export type BuilderOptions = {
  productType: ProductType;
  size: SizeOption;
  fabric: FabricOption;
  bagColor: BagColorOption;
  handleStrapColor: BagColorOption;
  closureType: ClosureOption;
  bagShape: BagShapeOption;
  handle: HandleOption;
  pocket: PocketOption;
  printSide: PrintSideOption;
  quantity: number;
};

export type DesignJson = Record<string, unknown>;

export type DesignState = Record<string, DesignJson | null>;

export type AnnotationStatus = "open" | "resolved";

export type AnnotationItem = {
  id: string;
  number: number;
  side: ViewSide;
  /** 0~1 캔버스 상대 좌표 */
  x: number;
  y: number;
  title: string;
  message: string;
  author: string;
  createdAt: string;
  status: AnnotationStatus;
};

/** @deprecated AnnotationItem 사용 */
export type CommentItem = {
  id: string;
  side: ViewSide;
  message: string;
  createdAt: string;
};

export type PriceBreakdown = {
  basePrice: number;
  sizeAddon: number;
  fabricAddon: number;
  handleAddon: number;
  pocketAddon: number;
  printSideAddon: number;
};

export type PriceResult = {
  unitPrice: number;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  totalPrice: number;
  breakdown: PriceBreakdown;
};

export type WorkOrderProcess = {
  name: string;
  instruction: string;
};

export type WorkOrderData = {
  orderNo: string;
  productType: ProductType;
  options: BuilderOptions;
  quantity: number;
  designData: DesignState;
  processes: WorkOrderProcess[];
  generatedAt: string;
};

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  ecobag: "에코백",
  "shopping-bag": "장바구니",
  pouch: "파우치",
};

export const SIZE_LABELS: Record<SizeOption, string> = {
  S: "S (20 × 24cm)",
  M: "M (22 × 26cm)",
  L: "L (26 × 30cm)",
};

export const SIZE_DIMENSIONS: Record<SizeOption, { w: number; h: number }> = {
  S: { w: 20, h: 24 },
  M: { w: 22, h: 26 },
  L: { w: 26, h: 30 },
};

/** 인쇄 영역 실측 (cm) — M 사이즈 기준 */
export const PRINT_AREA_CM = { w: 17, h: 20 } as const;

/** 목업 인쇄 비율이 맞춰진 기준 실측 (M) */
export const PRINT_AREA_REFERENCE_CM = { w: 22, h: 26 } as const;

export function bagSizeScale(size: SizeOption): number {
  return size === "S" ? 0.88 : size === "L" ? 1.1 : 1;
}

export const BAG_COLOR_LABELS: Record<BagColorOption, string> = {
  cream: "크림",
  white: "화이트",
  ivory: "아이보리",
  beige: "베이지",
  pink: "핑크",
  sky: "스카이",
  mint: "민트",
  yellow: "옐로우",
  navy: "네이비",
  black: "블랙",
};

export const FABRIC_LABELS: Record<FabricOption, string> = {
  cotton10: "면 10수",
  cotton20: "면 20수",
  canvas: "캔버스",
  nonwoven: "부직포",
};

export const HANDLE_LABELS: Record<HandleOption, string> = {
  basic: "기본 손잡이",
  long: "긴 손잡이",
  color: "컬러 손잡이",
};

export const POCKET_LABELS: Record<PocketOption, string> = {
  none: "없음",
  inner: "내부 포켓",
  outer: "외부 포켓",
};

export const PRINT_SIDE_LABELS: Record<PrintSideOption, string> = {
  front: "앞면",
  "front-back": "앞면+뒷면",
  "front-back-side": "앞면+뒷면+측면",
};

export const CLOSURE_LABELS: Record<ClosureOption, string> = {
  magnetic: "자석단추",
  snap: "똑딱이 단추",
  none: "없음",
};

export const BAG_SHAPE_LABELS: Record<BagShapeOption, string> = {
  "bottom-base": "밑바닥형",
  band: "밴드형",
  plain: "민자형",
  cross: "크로스형",
  "cross-handle": "크로스+손잡이형",
  "side-stitch": "옆폭 스테치형",
  "side-width": "옆폭형",
  cylinder: "원통형",
  drawstring: "조르개형",
};

export const DEFAULT_BUILDER_OPTIONS: BuilderOptions = {
  productType: "ecobag",
  size: "M",
  fabric: "cotton10",
  bagColor: "cream",
  handleStrapColor: "cream",
  closureType: "none",
  bagShape: "bottom-base",
  handle: "basic",
  pocket: "none",
  printSide: "front-back",
  quantity: 1,
};

export function normalizeBuilderOptions(
  partial?: Partial<BuilderOptions>,
): BuilderOptions {
  return {
    ...DEFAULT_BUILDER_OPTIONS,
    ...partial,
    bagColor: partial?.bagColor ?? DEFAULT_BUILDER_OPTIONS.bagColor,
    handleStrapColor:
      partial?.handleStrapColor ?? DEFAULT_BUILDER_OPTIONS.handleStrapColor,
    closureType: partial?.closureType ?? DEFAULT_BUILDER_OPTIONS.closureType,
    bagShape: partial?.bagShape ?? DEFAULT_BUILDER_OPTIONS.bagShape,
  };
}

export const DEFAULT_SIDE_LABELS: Record<string, string> = {
  front: "앞면",
  back: "뒷면",
  side: "측면",
};

/** @deprecated DEFAULT_SIDE_LABELS / resolveSideLabel 사용 */
export const SIDE_LABELS = DEFAULT_SIDE_LABELS;

export function resolveSideLabel(
  side: ViewSide,
  faces?: Array<{ side: string; label: string }> | null,
): string {
  const fromFace = faces?.find((f) => f.side === side)?.label?.trim();
  if (fromFace) return fromFace;
  return DEFAULT_SIDE_LABELS[side] ?? side;
}

export const ANNOTATION_STATUS_LABELS: Record<AnnotationStatus, string> = {
  open: "요청",
  resolved: "완료",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  DRAFT: "작성중",
  REVISION_REQUESTED: "수정요청",
  WAITING_APPROVAL: "승인대기",
  APPROVED: "최종승인",
};

export function getEnabledSides(printSide: PrintSideOption): ViewSide[] {
  if (printSide === "front") return ["front"];
  if (printSide === "front-back") return ["front", "back"];
  return ["front", "back", "side"];
}

/** 캔버스 미리보기에서 전환 가능한 면 (인쇄 옵션과 별개) */
export function getDesignViewSides(
  productType: ProductType,
  printSide: PrintSideOption,
  customSides?: ViewSide[] | null,
): ViewSide[] {
  if (customSides && customSides.length > 0) {
    return customSides;
  }
  if (productType === "ecobag") {
    if (printSide === "front-back-side") return ["front", "back", "side"];
    return ["front", "back"];
  }
  return getEnabledSides(printSide);
}
