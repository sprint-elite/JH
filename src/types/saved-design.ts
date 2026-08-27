import type {
  AnnotationItem,
  ApprovalStatus,
  BuilderOptions,
  DesignState,
  MockupOffsetState,
  ViewSide,
} from "./builder";

export const SAVED_DESIGN_VERSION = 1 as const;

export type SavedBuilderPayload = {
  version: typeof SAVED_DESIGN_VERSION;
  orderNo: string;
  options: BuilderOptions;
  currentSide: ViewSide;
  designData: DesignState;
  annotations: AnnotationItem[];
  mockupOffsets: MockupOffsetState;
  approvalStatus: ApprovalStatus;
};

export type SavedDesignListItem = {
  id: string;
  title: string;
  productType: string;
  updatedAt: string;
  createdAt: string;
};

export type SavedDesignDetail = SavedDesignListItem & {
  builderJson: SavedBuilderPayload;
};
