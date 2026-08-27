/** 검색어와 일치하는 구간을 분리 (대소문자 무시) */
export function splitHighlightParts(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  const q = query.trim();
  if (!q) return [{ text, match: false }];

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let start = 0;

  while (start < text.length) {
    const idx = lower.indexOf(needle, start);
    if (idx === -1) {
      parts.push({ text: text.slice(start), match: false });
      break;
    }
    if (idx > start) {
      parts.push({ text: text.slice(start, idx), match: false });
    }
    parts.push({ text: text.slice(idx, idx + needle.length), match: true });
    start = idx + needle.length;
  }

  return parts.length > 0 ? parts : [{ text, match: false }];
}
