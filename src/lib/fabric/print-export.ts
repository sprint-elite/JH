import type { BuilderOptions, SizeOption } from "@/types/builder";
import {
  PRINT_AREA_CM,
  bagSizeScale,
} from "@/types/builder";

export const PRINT_EXPORT_DPI = 300;
const CM_PER_INCH = 2.54;

export function cmToPixelsAtDpi(cm: number, dpi = PRINT_EXPORT_DPI): number {
  return Math.round((cm / CM_PER_INCH) * dpi);
}

/** 인쇄 실측(cm) — 사이즈별 스케일 반영 */
export function getPrintPhysicalSizeCm(size: SizeOption): { w: number; h: number } {
  const scale = bagSizeScale(size);
  return {
    w: Math.round(PRINT_AREA_CM.w * scale * 10) / 10,
    h: Math.round(PRINT_AREA_CM.h * scale * 10) / 10,
  };
}

export function getPrintExportPixelSize(options: BuilderOptions): {
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
  dpi: number;
} {
  const { w, h } = getPrintPhysicalSizeCm(options.size);
  return {
    widthCm: w,
    heightCm: h,
    width: cmToPixelsAtDpi(w),
    height: cmToPixelsAtDpi(h),
    dpi: PRINT_EXPORT_DPI,
  };
}
