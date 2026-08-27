import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { encodeOAuthState } from "@/lib/oauth-state";

/** Google OAuth 시작 — GOOGLE_CLIENT_ID 필요 */
export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return NextResponse.redirect(
      `${getSiteUrl()}/login?error=google_config`,
    );
  }

  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next")?.trim() || "/";
  const agreeTerms = searchParams.get("agreeTerms") === "1";
  const agreePrivacy = searchParams.get("agreePrivacy") === "1";

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    `${getSiteUrl()}/api/auth/google/callback`;

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set(
    "state",
    encodeOAuthState({ next, agreeTerms, agreePrivacy }),
  );

  return NextResponse.redirect(url.toString());
}
