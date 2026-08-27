import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { getSiteUrl } from "@/lib/site-url";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { decodeOAuthState } from "@/lib/oauth-state";

type KakaoToken = { access_token?: string; error?: string };
type KakaoMe = {
  id?: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string };
  };
};

export async function GET(request: Request) {
  try {
    const clientId = process.env.KAKAO_REST_API_KEY?.trim();
    const clientSecret = process.env.KAKAO_CLIENT_SECRET?.trim();
    if (!clientId) {
      return jsonError("카카오 API 키가 없습니다.", 503);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const state = decodeOAuthState(searchParams.get("state"));
    const nextPath = state.next;
    const consented = Boolean(state.agreeTerms && state.agreePrivacy);

    if (oauthError || !code) {
      return NextResponse.redirect(
        `${getSiteUrl()}/login?error=kakao_denied`,
      );
    }

    const redirectUri =
      process.env.KAKAO_REDIRECT_URI?.trim() ||
      `${getSiteUrl()}/api/auth/kakao/callback`;

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        ...(clientSecret ? { client_secret: clientSecret } : {}),
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenJson = (await tokenRes.json()) as KakaoToken;
    if (!tokenJson.access_token) {
      return NextResponse.redirect(
        `${getSiteUrl()}/login?error=kakao_token`,
      );
    }

    const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` },
    });
    const me = (await meRes.json()) as KakaoMe;
    const oauthId = me.id != null ? String(me.id) : "";
    if (!oauthId) {
      return NextResponse.redirect(`${getSiteUrl()}/login?error=kakao_user`);
    }

    const email =
      me.kakao_account?.email?.toLowerCase() ||
      `kakao_${oauthId}@oauth.jhmaker.local`;
    const name =
      me.kakao_account?.profile?.nickname?.trim() || `카카오사용자`;
    const now = new Date();

    let user = await prisma.user.findFirst({
      where: { oauthProvider: "kakao", oauthId },
    });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      const needsConsent =
        !byEmail ||
        Boolean(byEmail.deletedAt) ||
        !byEmail.termsAgreedAt ||
        !byEmail.privacyAgreedAt;
      if (needsConsent && !consented) {
        return NextResponse.redirect(
          `${getSiteUrl()}/login?error=oauth_consent`,
        );
      }

      if (byEmail && !byEmail.deletedAt) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            oauthProvider: "kakao",
            oauthId,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? now,
            termsAgreedAt: byEmail.termsAgreedAt ?? now,
            privacyAgreedAt: byEmail.privacyAgreedAt ?? now,
          },
        });
      } else if (byEmail?.deletedAt) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            name,
            passwordHash: null,
            oauthProvider: "kakao",
            oauthId,
            emailVerifiedAt: now,
            termsAgreedAt: now,
            privacyAgreedAt: now,
            deletedAt: null,
            isGuest: false,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash: null,
            oauthProvider: "kakao",
            oauthId,
            emailVerifiedAt: now,
            termsAgreedAt: now,
            privacyAgreedAt: now,
            role: "CUSTOMER",
          },
        });
      }
    }

    if (user.deletedAt) {
      return NextResponse.redirect(
        `${getSiteUrl()}/login?error=kakao_denied`,
      );
    }

    const session = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const path =
      user.role === "ADMIN" && (nextPath === "/" || !nextPath)
        ? "/admin"
        : nextPath;
    const response = NextResponse.redirect(`${getSiteUrl()}${path}`);
    const cookie = sessionCookieOptions(session);
    response.cookies.set(cookie.name, cookie.value, cookie);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
