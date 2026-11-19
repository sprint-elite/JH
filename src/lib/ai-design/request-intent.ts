export type AiPlaceSlot = "print-center" | "left-chest" | "back-large";
export type AiLogoSize = "small" | "medium" | "large";

export type AiRequestIntent = {
  size: AiLogoSize;
  slot: AiPlaceSlot;
  printScale: number;
};

const SMALL_RE =
  /작게|작은\s*로고|소형|미니|조그맣|조금\s*작|가슴|포켓|왼쪽\s*가|좌측|left\s*chest|small|mini/i;
const LARGE_RE =
  /크게|큰\s*로고|대형|등판|등\s*크게|뒷면\s*크게|풀\s*프린트|풀사이즈|large|huge|full\s*back/i;
const CHEST_RE = /가슴|포켓|왼쪽|좌측|left\s*chest/i;
const BACK_RE = /등판|등쪽|뒷면|등\s*크게|back\s*print|on\s*the\s*back/i;

function lastMatchIndex(re: RegExp, text: string) {
  const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
  const global = new RegExp(re.source, flags);
  let last = -1;
  let match: RegExpExecArray | null;
  while ((match = global.exec(text))) {
    last = match.index;
    if (match[0].length === 0) break;
  }
  return last;
}

export function parseAiRequestIntent(
  features?: string,
  reference?: string,
): AiRequestIntent {
  const text = [features, reference].filter(Boolean).join(" ");
  const smallAt = lastMatchIndex(SMALL_RE, text);
  const largeAt = lastMatchIndex(LARGE_RE, text);

  let size: AiLogoSize = "medium";
  if (smallAt >= 0 || largeAt >= 0) {
    size = largeAt > smallAt ? "large" : "small";
  }

  let slot: AiPlaceSlot = "print-center";
  if (CHEST_RE.test(text)) slot = "left-chest";
  else if (BACK_RE.test(text)) slot = "back-large";

  if (slot === "left-chest" && size === "medium") size = "small";
  if (slot === "back-large" && size === "medium") size = "large";

  let printScale = size === "small" ? 0.32 : size === "large" ? 0.86 : 0.58;
  if (slot === "left-chest" && size !== "large") printScale = 0.26;
  if (slot === "back-large" && size === "large") printScale = 0.88;

  return { size, slot, printScale };
}
