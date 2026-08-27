export type OAuthStatePayload = {
  next: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
};

export function encodeOAuthState(payload: OAuthStatePayload): string {
  const next = payload.next.startsWith("/") ? payload.next : "/";
  return encodeURIComponent(
    JSON.stringify({
      next,
      agreeTerms: Boolean(payload.agreeTerms),
      agreePrivacy: Boolean(payload.agreePrivacy),
    }),
  );
}

export function decodeOAuthState(raw: string | null): OAuthStatePayload {
  if (!raw) return { next: "/" };
  try {
    const decoded = decodeURIComponent(raw);
    // 구버전: state가 경로만인 경우
    if (decoded.startsWith("/")) {
      return { next: decoded };
    }
    const parsed = JSON.parse(decoded) as Partial<OAuthStatePayload>;
    const next =
      typeof parsed.next === "string" && parsed.next.startsWith("/")
        ? parsed.next
        : "/";
    return {
      next,
      agreeTerms: Boolean(parsed.agreeTerms),
      agreePrivacy: Boolean(parsed.agreePrivacy),
    };
  } catch {
    try {
      const decoded = decodeURIComponent(raw);
      if (decoded.startsWith("/")) return { next: decoded };
    } catch {
      /* ignore */
    }
    return { next: "/" };
  }
}
