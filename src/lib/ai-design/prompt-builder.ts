import { parseAiRequestIntent } from "@/lib/ai-design/request-intent";

function hasHangul(text: string) {
  return /[\uAC00-\uD7A3]/.test(text);
}

/**
 * 사용자 입력을 그대로 최우선으로 전달한다.
 * 업종·색상·금지 모티프를 코드에서 추론하지 않는다.
 */
export function buildAiImagePrompt(input: {
  title: string;
  features?: string;
  reference?: string;
  hasReferenceImages?: boolean;
  /** 워드마크 없이 심볼·아이콘만 */
  logoOnly?: boolean;
}) {
  const title = input.title.trim();
  const features = input.features?.trim() ?? "";
  const reference = input.reference?.trim() ?? "";
  const intent = parseAiRequestIntent(features, reference);

  if (input.logoOnly) {
    const userBrief = [
      features ? `Requirements:\n${features}` : "",
      reference ? `Reference / notes:\n${reference}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const imageNote = input.hasReferenceImages
      ? [
          "Attached image(s) are STYLE REFERENCES ONLY (palette, mood, shape language).",
          "Do not copy trademarks, characters, or an existing logo layout.",
          "The result must be a symbol/mark with zero text.",
        ].join(" ")
      : "";

    const sizeLine =
      intent.size === "small"
        ? "Print scale: compact mark for a small chest print."
        : intent.size === "large"
          ? "Print scale: large back print with bold readable shapes."
          : "Print scale: standard logo size unless the user asked otherwise.";

    const placeLine =
      intent.slot === "left-chest"
        ? "Placement target: left chest."
        : intent.slot === "back-large"
          ? "Placement target: large back print."
          : "Placement target: main print area.";

    return [
      "=== USER BRIEF (highest priority — obey this over everything else) ===",
      userBrief || "(No extra requirements — create a versatile symbol suitable for team apparel.)",
      "",
      "Read the brief carefully. Apply colors, mood, motifs, and exclusions the user wrote.",
      "",
      "=== OUTPUT ===",
      "Create one original flat vector-style icon or emblem suitable for screen printing on apparel.",
      "NO text, NO letters, NO numbers, NO words, NO typography, NO hangul, NO roman letters — symbol/mark/illustration only.",
      sizeLine,
      placeLine,
      imageNote,
      "",
      "=== RULES ===",
      "Do not invent a theme the user did not ask for.",
      "Any visible letters, numbers, or words is a failed result.",
      "Square PNG, transparent background outside the mark, flat colors, crisp edges.",
      "No mockup, no t-shirt photo, no photorealism.",
      "Do not copy trademarks, celebrities, or copyrighted characters.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  const lettering = hasHangul(title)
    ? `Required lettering is Korean Hangul. Draw every syllable exactly as written: ${title}. Do not romanize, translate, omit, or replace it with English.`
    : `Spell the required lettering exactly as: ${title}. Do not add or drop characters.`;

  const sizeLine =
    intent.size === "small"
      ? "Print scale: compact mark for a small chest print."
      : intent.size === "large"
        ? "Print scale: large back print with bold readable shapes."
        : "Print scale: standard logo size unless the user asked otherwise.";

  const placeLine =
    intent.slot === "left-chest"
      ? "Placement target: left chest."
      : intent.slot === "back-large"
        ? "Placement target: large back print."
        : "Placement target: main print area.";

  const imageNote = input.hasReferenceImages
    ? [
        "Attached image(s) are STYLE REFERENCES ONLY (palette, mood, composition).",
        "Do not copy trademarks, characters, or an existing logo layout.",
        `The new mark must still show the text "${title}".`,
      ].join(" ")
    : "";

  const userBrief = [
    features ? `Requirements:\n${features}` : "",
    reference ? `Reference / notes:\n${reference}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    "=== USER BRIEF (highest priority — obey this over everything else) ===",
    userBrief || "(No extra requirements beyond the brand text.)",
    "",
    "Read the brief carefully. Apply every instruction the user wrote about:",
    "colors and palette, industry/use-case, mood, layout, size, what to include, and what NOT to do.",
    "If the brief says something is wrong or unwanted, do not draw it.",
    "If the brief names colors, use only those colors (white only for contrast if needed).",
    `The brand text "${title}" is lettering to display — do not invent icons by literally illustrating the brand name unless the brief asks for that.`,
    "",
    "=== OUTPUT ===",
    "Create one original flat vector-style logo/emblem suitable for screen printing on apparel.",
    `Required visible text: "${title}".`,
    lettering,
    sizeLine,
    placeLine,
    imageNote,
    "",
    "=== RULES ===",
    "Do not invent a theme, industry, or motif the user did not ask for.",
    "When the brief and any default habit conflict, the brief wins.",
    "A logo missing the required text is a failed result.",
    "Square PNG, transparent background outside the logo, flat colors, crisp edges.",
    "No mockup, no t-shirt photo, no photorealism, no tiny unreadable text.",
    "Lettering must be opaque painted pixels. White text must stay solid white, not transparent knockouts.",
    "Do not copy trademarks, celebrities, or copyrighted characters.",
  ]
    .filter(Boolean)
    .join("\n");
}
