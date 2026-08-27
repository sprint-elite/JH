import { DEFAULT_MOCKUP_OFFSET, normalizeBuilderOptions } from "@/types/builder";
import type { SavedBuilderPayload } from "@/types/saved-design";
import { SAVED_DESIGN_VERSION } from "@/types/saved-design";

type BuilderExportState = {
  orderNo: string;
  options: SavedBuilderPayload["options"];
  currentSide: SavedBuilderPayload["currentSide"];
  designData: SavedBuilderPayload["designData"];
  annotations: SavedBuilderPayload["annotations"];
  mockupOffsets: SavedBuilderPayload["mockupOffsets"];
  approvalStatus: SavedBuilderPayload["approvalStatus"];
};

export function exportBuilderPayload(state: BuilderExportState): SavedBuilderPayload {
  return {
    version: SAVED_DESIGN_VERSION,
    orderNo: state.orderNo,
    options: state.options,
    currentSide: state.currentSide,
    designData: state.designData,
    annotations: state.annotations,
    mockupOffsets: state.mockupOffsets,
    approvalStatus: state.approvalStatus,
  };
}

export function parseBuilderPayload(raw: unknown): SavedBuilderPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<SavedBuilderPayload>;
  if (data.version !== SAVED_DESIGN_VERSION) return null;
  if (!data.options || !data.designData) return null;

  return {
    version: SAVED_DESIGN_VERSION,
    orderNo: typeof data.orderNo === "string" ? data.orderNo : "",
    options: normalizeBuilderOptions(data.options),
    currentSide: data.currentSide ?? "front",
    designData: data.designData,
    annotations: Array.isArray(data.annotations) ? data.annotations : [],
    mockupOffsets: data.mockupOffsets ?? { ...DEFAULT_MOCKUP_OFFSET },
    approvalStatus: data.approvalStatus ?? "DRAFT",
  };
}

export function productSlugFromType(productType: string): string {
  return productType;
}
