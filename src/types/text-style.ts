export type TextAlignOption = "left" | "center" | "right" | "justify";

export type TextStyleState = {
  fontFamily: string;
  fontSize: number;
  fill: string;
  textAlign: TextAlignOption;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  underline: boolean;
  linethrough: boolean;
  lineHeight: number;
  charSpacing: number;
};

import type { ImageStyleState } from "./image-style";

export type CanvasSelectionState =
  | { kind: "none" }
  | { kind: "object" }
  | { kind: "text"; style: TextStyleState }
  | { kind: "image"; style: ImageStyleState };

export const TEXT_FONT_OPTIONS: { label: string; value: string }[] = [
  { label: "맑은 고딕", value: "'Malgun Gothic', sans-serif" },
  { label: "Apple SD Gothic", value: "'Apple SD Gothic Neo', sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Helvetica", value: "Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', serif" },
  { label: "Courier New", value: "'Courier New', monospace" },
  { label: "Impact", value: "Impact, sans-serif" },
];

export const TEXT_SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96,
];

export const TEXT_LINE_HEIGHT_OPTIONS = [0.8, 1, 1.2, 1.5, 1.8, 2];
