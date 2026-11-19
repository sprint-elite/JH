/** 빌더 텍스트 글꼴 — Google Fonts는 BuilderFontsLoader에서 일괄 로드 */

export type BuilderFontOption = {
  label: string;
  value: string;
  /** Google Fonts family name (로드·canvas 렌더용) */
  googleFamily?: string;
};

export type BuilderFontGroup = {
  label: string;
  options: BuilderFontOption[];
};

function gf(name: string, stack: string): BuilderFontOption {
  return { label: name, value: `'${name}', ${stack}`, googleFamily: name };
}

export const BUILDER_FONT_GROUPS: BuilderFontGroup[] = [
  {
    label: "한글 · 고딕",
    options: [
      gf("Noto Sans KR", "sans-serif"),
      gf("Nanum Gothic", "sans-serif"),
      gf("Gothic A1", "sans-serif"),
      gf("Gowun Dodum", "sans-serif"),
      gf("Do Hyeon", "sans-serif"),
      { label: "맑은 고딕", value: "'Malgun Gothic', sans-serif" },
      { label: "Apple SD Gothic", value: "'Apple SD Gothic Neo', sans-serif" },
    ],
  },
  {
    label: "한글 · 명조·손글씨",
    options: [
      gf("Noto Serif KR", "serif"),
      gf("Nanum Myeongjo", "serif"),
      gf("Gowun Batang", "serif"),
      gf("Nanum Pen Script", "cursive"),
      gf("Single Day", "cursive"),
    ],
  },
  {
    label: "포스터 · 임팩트",
    options: [
      gf("Black Han Sans", "sans-serif"),
      gf("Jua", "sans-serif"),
      gf("Bebas Neue", "sans-serif"),
      gf("Anton", "sans-serif"),
      gf("Oswald", "sans-serif"),
      gf("Bangers", "cursive"),
      gf("Luckiest Guy", "cursive"),
      gf("Permanent Marker", "cursive"),
      { label: "Impact", value: "Impact, sans-serif" },
    ],
  },
  {
    label: "영문 · 산세리프",
    options: [
      gf("Inter", "sans-serif"),
      gf("Roboto", "sans-serif"),
      gf("Open Sans", "sans-serif"),
      gf("Montserrat", "sans-serif"),
      gf("Poppins", "sans-serif"),
      { label: "Arial", value: "Arial, sans-serif" },
      { label: "Helvetica", value: "Helvetica, sans-serif" },
    ],
  },
  {
    label: "영문 · 세리프",
    options: [
      gf("Playfair Display", "serif"),
      gf("Merriweather", "serif"),
      gf("Lora", "serif"),
      { label: "Georgia", value: "Georgia, serif" },
      { label: "Times New Roman", value: "'Times New Roman', serif" },
    ],
  },
  {
    label: "고정폭 · 기타",
    options: [
      gf("Fira Code", "monospace"),
      gf("JetBrains Mono", "monospace"),
      { label: "Courier New", value: "'Courier New', monospace" },
      gf("Pacifico", "cursive"),
    ],
  },
];

export const TEXT_FONT_OPTIONS: BuilderFontOption[] =
  BUILDER_FONT_GROUPS.flatMap((g) => g.options);

const googleFamilies = [
  ...new Set(
    TEXT_FONT_OPTIONS.map((o) => o.googleFamily).filter(Boolean) as string[],
  ),
];

/** Google Fonts CSS2 URL (한글 서브셋 포함) */
export function builderGoogleFontsStylesheetHref(): string {
  const singleWeight = new Set([
    "Anton",
    "Bangers",
    "Bebas Neue",
    "Black Han Sans",
    "Do Hyeon",
    "Jua",
    "Luckiest Guy",
    "Nanum Pen Script",
    "Pacifico",
    "Permanent Marker",
    "Single Day",
  ]);
  const params = googleFamilies
    .map((family) => {
      const id = family.replace(/\s+/g, "+");
      if (singleWeight.has(family)) return `family=${id}`;
      return `family=${id}:wght@400;700`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

export async function ensureBuilderFontLoaded(
  fontFamilyCss: string,
): Promise<void> {
  if (typeof document === "undefined") return;
  const opt = TEXT_FONT_OPTIONS.find((o) => o.value === fontFamilyCss);
  if (!opt?.googleFamily) return;
  const spec = `16px "${opt.googleFamily}"`;
  if (document.fonts.check(spec)) return;
  try {
    await document.fonts.load(spec);
  } catch {
    /* 네트워크 지연 시에도 fallback으로 표시 */
  }
}
