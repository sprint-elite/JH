import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { encodeOAuthState } from "@/lib/oauth-state";

/** 카카오 OAuth 시작 — KAKAO_REST_API_KEY 필요 */
export async function GET(request: Request) {
  const clientId = process.env.KAKAO_REST_API_KEY?.trim();
  if (!clientId) {
    return NextResponse.redirect(
      `${getSiteUrl()}/login?error=kakao_config`,
    );
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next")?.trim() || "/";
  const agreeTerms = searchParams.get("agreeTerms") === "1";
  const agreePrivacy = searchParams.get("agreePrivacy") === "1";

  const redirectUri =
    process.env.KAKAO_REDIRECT_URI?.trim() ||
    `${getSiteUrl()}/api/auth/kakao/callback`;

  const url = new URL("https://kauth.kakao.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "state",
    encodeOAuthState({ next, agreeTerms, agreePrivacy }),
  );

  return NextResponse.redirect(url.toString());
}
