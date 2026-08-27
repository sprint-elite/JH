/** 송장번호 → 택배 조회 링크 (스마트택배 통합 조회) */
export function trackingLookupUrl(trackingNumber: string): string {
  const q = encodeURIComponent(trackingNumber.trim());
  return `https://search.naver.com/search.naver?query=${q}+배송조회`;
}

export function formatTrackingDisplay(trackingNumber: string | null | undefined) {
  const t = trackingNumber?.trim();
  if (!t) return null;
  return t;
}
