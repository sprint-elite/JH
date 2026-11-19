import type { FabricObject } from "fabric";
import type { TextAlignOption, TextStyleState } from "@/types/text-style";

type TextLike = FabricObject & {
  fontFamily?: string;
  fontSize?: number;
  fill?: string | unknown;
  textAlign?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  underline?: boolean;
  linethrough?: boolean;
  lineHeight?: number;
  charSpacing?: number;
};

export function isTextObject(obj: FabricObject): boolean {
  const t = obj.type ?? "";
  return (
    t === "i-text" ||
    t === "text" ||
    t === "textbox" ||
    t === "IText" ||
    t === "Text" ||
    t === "Textbox"
  );
}

export function normalizeFontFamily(fontFamily?: string): string {
  if (!fontFamily) return "Arial, sans-serif";
  return fontFamily.split(",")[0]?.replace(/['"]/g, "").trim()
    ? fontFamily
    : "Arial, sans-serif";
}

function isBold(fontWeight?: string | number): boolean {
  return fontWeight === "bold" || fontWeight === 700 || fontWeight === "700";
}

function normalizeFill(fill: unknown): string {
  if (typeof fill === "string") return fill;
  return "#18181b";
}

function normalizeTextAlign(value?: string): TextAlignOption {
  if (value === "center" || value === "right" || value === "justify") return value;
  return "left";
}

export function readTextStyle(obj: TextLike): TextStyleState {
  return {
    fontFamily: normalizeFontFamily(obj.fontFamily),
    fontSize: obj.fontSize ?? 28,
    fill: normalizeFill(obj.fill),
    textAlign: normalizeTextAlign(obj.textAlign),
    fontWeight: isBold(obj.fontWeight) ? "bold" : "normal",
    fontStyle: obj.fontStyle === "italic" ? "italic" : "normal",
    underline: !!obj.underline,
    linethrough: !!obj.linethrough,
    lineHeight: obj.lineHeight ?? 1.16,
    charSpacing: obj.charSpacing ?? 0,
  };
}

export function applyTextStylePatch(
  obj: TextLike,
  patch: Partial<TextStyleState>,
): void {
  const next: Record<string, unknown> = { ...patch };
  if (patch.fontWeight) next.fontWeight = patch.fontWeight;
  if (patch.fontStyle) next.fontStyle = patch.fontStyle;
  obj.set(next);
}

/** scaleX/scaleY를 fontSize에 반영하고 1:1로 — 납작·늘어짐 방지 */
export function bakeTextObjectScale(obj: TextLike): void {
  const sx = obj.scaleX ?? 1;
  const sy = obj.scaleY ?? 1;
  if (Math.abs(sx - 1) < 0.001 && Math.abs(sy - 1) < 0.001) return;
  const size = obj.fontSize ?? 28;
  const scale = Math.sqrt(sx * sy);
  obj.set({
    fontSize: size * scale,
    scaleX: 1,
    scaleY: 1,
  });
}
