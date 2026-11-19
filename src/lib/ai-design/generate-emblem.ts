export type EmblemStyle = "ring" | "stamp" | "wordmark" | "shield";

export type EmblemPalette = {
  id: string;
  name: string;
  ink: string;
  fill: string;
  accent: string;
};

export const EMBLEM_PALETTES: EmblemPalette[] = [
  { id: "ink", name: "잉크", ink: "#18181b", fill: "#ffffff", accent: "#18181b" },
  { id: "navy", name: "네이비", ink: "#f8fafc", fill: "#1e3a5f", accent: "#d4af37" },
  { id: "varsity", name: "바시티", ink: "#fff7ed", fill: "#9f1239", accent: "#fde68a" },
  { id: "forest", name: "포레스트", ink: "#ecfdf5", fill: "#14532d", accent: "#86efac" },
  { id: "rose", name: "로즈", ink: "#fff1f2", fill: "#e11d48", accent: "#fecdd3" },
];

export type EmblemResult = {
  id: string;
  style: string;
  label: string;
  dataUrl: string;
  source: "local" | "openai";
};

export type EmblemLayout = "horizontal" | "vertical";
export type EmblemNameMode = "full" | "initial";

export type EmblemExtras = {
  slogan?: string;
  year?: string;
  layout?: EmblemLayout;
  nameMode?: EmblemNameMode;
};

const SIZE = 640;
const FONT =
  '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", "Apple Gothic", sans-serif';

type PromptParts = {
  title: string;
  subtitle: string;
  monogram: string;
  motif: Motif;
};

type Motif = "star" | "ball" | "note" | "cap" | "bolt";

function detectMotif(raw: string): Motif {
  if (/축구|풋볼|농구|야구|배구|스포츠|팀/.test(raw)) return "ball";
  if (/음악|밴드|합창|노래|댄스/.test(raw)) return "note";
  if (/졸업|학번|동문|alumni/i.test(raw)) return "cap";
  if (/번개|에너지|런닝|러닝|마라톤/.test(raw)) return "bolt";
  return "star";
}

export function suggestPaletteForBagColor(color: string): EmblemPalette {
  if (color === "black" || color === "navy") {
    return EMBLEM_PALETTES[0];
  }
  if (color === "pink") return EMBLEM_PALETTES[1];
  if (color === "mint" || color === "sky") return EMBLEM_PALETTES[3];
  return EMBLEM_PALETTES[1];
}

function buildParts(prompt: string, extras?: EmblemExtras): PromptParts {
  const base = parseDesignPrompt(prompt);
  const slogan = extras?.slogan?.trim() ?? "";
  const year = extras?.year?.trim() ?? "";
  const extraLine = [slogan, year].filter(Boolean).join(" · ");
  if (extras?.nameMode === "initial") {
    return {
      title: base.monogram,
      subtitle: [base.title, extraLine || base.subtitle].filter(Boolean).join(" · "),
      monogram: base.monogram,
      motif: base.motif,
    };
  }
  return {
    ...base,
    subtitle: extraLine || base.subtitle,
  };
}

export function parseDesignPrompt(prompt: string): PromptParts {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ").filter(Boolean);
  const title = parts.length <= 1 ? parts[0] ?? "DAEJI" : parts.slice(0, -1).join(" ");
  const subtitle = parts.length <= 1 ? "" : parts[parts.length - 1];
  const monogram = Array.from(title.replace(/[^0-9A-Za-z가-힣]/g, ""))[0] ?? "D";
  return { title, subtitle, monogram, motif: detectMotif(cleaned) };
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  minSize = 18,
) {
  let size = maxSize;
  ctx.font = `800 ${size}px ${FONT}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `800 ${size}px ${FONT}`;
  }
  return size;
}

function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: Motif,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  if (motif === "ball") {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(0, -r * 0.4, r * 0.7, 0);
    ctx.moveTo(-r * 0.7, 0);
    ctx.quadraticCurveTo(0, r * 0.4, r * 0.7, 0);
    ctx.stroke();
  } else if (motif === "note") {
    ctx.beginPath();
    ctx.arc(-r * 0.35, r * 0.35, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(r * 0.05, -r * 0.85, 7, r * 1.15);
    ctx.beginPath();
    ctx.moveTo(r * 0.05 + 7, -r * 0.85);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.55, r * 0.05 + 7, -r * 0.15);
    ctx.fill();
  } else if (motif === "cap") {
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-r * 0.55, 0, r * 1.1, r * 0.28);
    ctx.fillRect(r * 0.15, -r * 0.08, r * 0.7, 7);
  } else if (motif === "bolt") {
    ctx.beginPath();
    ctx.moveTo(r * 0.15, -r);
    ctx.lineTo(-r * 0.35, r * 0.1);
    ctx.lineTo(r * 0.05, r * 0.1);
    ctx.lineTo(-r * 0.15, r);
    ctx.lineTo(r * 0.45, -r * 0.05);
    ctx.lineTo(0, -r * 0.05);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      const b = a + Math.PI / 5;
      const ox = Math.cos(a) * r;
      const oy = Math.sin(a) * r;
      const ix = Math.cos(b) * r * 0.42;
      const iy = Math.sin(b) * r * 0.42;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function makeCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스를 만들 수 없습니다.");
  return { canvas, ctx };
}

function drawRing(ctx: CanvasRenderingContext2D, parts: PromptParts, palette: EmblemPalette) {
  const c = SIZE / 2;
  ctx.beginPath();
  ctx.arc(c, c, 292, 0, Math.PI * 2);
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.lineWidth = 22;
  ctx.strokeStyle = palette.accent;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(c, c, 262, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = palette.ink;
  ctx.stroke();

  drawMotif(ctx, parts.motif, c, c - 70, 42, palette.accent);

  const titleSize = fitText(ctx, parts.title, 380, 56, 22);
  ctx.fillStyle = palette.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${titleSize}px ${FONT}`;
  ctx.fillText(parts.title, c, c + 28);

  if (parts.subtitle) {
    ctx.font = `700 22px ${FONT}`;
    ctx.fillStyle = palette.accent;
    ctx.fillText(parts.subtitle.toUpperCase(), c, c + 78);
  }
}

function drawStamp(ctx: CanvasRenderingContext2D, parts: PromptParts, palette: EmblemPalette) {
  const c = SIZE / 2;
  ctx.setLineDash([16, 10]);
  ctx.beginPath();
  ctx.arc(c, c, 286, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = palette.fill;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(c, c, 250, 0, Math.PI * 2);
  ctx.lineWidth = 18;
  ctx.strokeStyle = palette.fill;
  ctx.stroke();

  ctx.fillStyle = palette.fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleSize = fitText(ctx, parts.title, 360, 62, 24);
  ctx.font = `800 ${titleSize}px ${FONT}`;
  ctx.fillText(parts.title, c, parts.subtitle ? c - 8 : c + 8);

  if (parts.subtitle) {
    ctx.font = `700 20px ${FONT}`;
    ctx.fillText(`★ ${parts.subtitle} ★`, c, c + 58);
  }
}

function drawWordmark(
  ctx: CanvasRenderingContext2D,
  parts: PromptParts,
  palette: EmblemPalette,
  layout: EmblemLayout = "horizontal",
) {
  ctx.fillStyle = palette.fill;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (layout === "vertical") {
    const chars = Array.from(parts.title).slice(0, 8);
    const size = chars.length > 4 ? 52 : 72;
    ctx.font = `900 ${size}px ${FONT}`;
    const startY = 200 - ((chars.length - 1) * (size + 8)) / 2;
    chars.forEach((ch, i) => {
      ctx.fillText(ch, SIZE / 2, startY + i * (size + 8));
    });
    if (parts.subtitle) {
      ctx.fillStyle = palette.accent;
      ctx.font = `700 22px ${FONT}`;
      ctx.fillText(parts.subtitle, SIZE / 2, 500);
    }
    return;
  }

  const titleSize = fitText(ctx, parts.title, 520, 92, 32);
  ctx.font = `900 ${titleSize}px ${FONT}`;
  ctx.fillText(parts.title, SIZE / 2, parts.subtitle ? 280 : 320);

  ctx.fillStyle = palette.accent;
  ctx.fillRect(SIZE / 2 - 90, parts.subtitle ? 330 : 370, 180, 10);

  if (parts.subtitle) {
    ctx.fillStyle = palette.fill;
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(parts.subtitle, SIZE / 2, 390);
  }
}

function drawShield(ctx: CanvasRenderingContext2D, parts: PromptParts, palette: EmblemPalette) {
  ctx.beginPath();
  ctx.moveTo(320, 36);
  ctx.lineTo(548, 128);
  ctx.lineTo(508, 400);
  ctx.quadraticCurveTo(320, 610, 132, 400);
  ctx.lineTo(92, 128);
  ctx.closePath();
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = palette.accent;
  ctx.stroke();

  ctx.fillStyle = palette.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 72px ${FONT}`;
  ctx.fillText(parts.monogram, 320, 210);

  const titleSize = fitText(ctx, parts.title, 300, 40, 18);
  ctx.font = `800 ${titleSize}px ${FONT}`;
  ctx.fillText(parts.title, 320, 310);

  if (parts.subtitle) {
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = palette.accent;
    ctx.fillText(parts.subtitle, 320, 360);
  }
}

const DRAWERS: Record<
  EmblemStyle,
  (
    ctx: CanvasRenderingContext2D,
    parts: PromptParts,
    palette: EmblemPalette,
    layout: EmblemLayout,
  ) => void
> = {
  ring: (ctx, parts, palette) => drawRing(ctx, parts, palette),
  stamp: (ctx, parts, palette) => drawStamp(ctx, parts, palette),
  wordmark: (ctx, parts, palette, layout) =>
    drawWordmark(ctx, parts, palette, layout),
  shield: (ctx, parts, palette) => drawShield(ctx, parts, palette),
};

const STYLE_LABEL: Record<EmblemStyle, string> = {
  ring: "엠블럼",
  stamp: "스탬프",
  wordmark: "워드마크",
  shield: "방패",
};

export function generateEmblem(
  prompt: string,
  style: EmblemStyle,
  palette: EmblemPalette,
  extras?: EmblemExtras,
): EmblemResult {
  const parts = buildParts(prompt, extras);
  const layout = extras?.layout ?? "horizontal";
  const { canvas, ctx } = makeCanvas();
  DRAWERS[style](ctx, parts, palette, layout);
  return {
    id: `${style}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    style,
    label: STYLE_LABEL[style],
    dataUrl: canvas.toDataURL("image/png"),
    source: "local",
  };
}

export function generateEmblemSet(
  prompt: string,
  palette: EmblemPalette,
  extras?: EmblemExtras,
): EmblemResult[] {
  return (["ring", "stamp", "wordmark", "shield"] as const).map((style) =>
    generateEmblem(prompt, style, palette, extras),
  );
}
