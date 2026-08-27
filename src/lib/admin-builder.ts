/** 관리자 → 빌더 → 관리자 복귀용 쿼리 헬퍼 */

export function buildAdminBuilderHref(opts: {
  productSlug: string;
  orderId: string;
}): string {
  const returnTo = `/admin/orders?order=${encodeURIComponent(opts.orderId)}`;
  const params = new URLSearchParams({
    product: opts.productSlug,
    order: opts.orderId,
    from: "admin",
    returnTo,
  });
  return `/builder?${params.toString()}`;
}

/** open redirect 방지 — /admin 하위 상대 경로만 허용 */
export function safeAdminReturnTo(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/admin")) return null;
  if (decoded.startsWith("//") || decoded.includes("://")) return null;
  return decoded;
}
