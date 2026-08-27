import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { getSiteUrl } from "@/lib/site-url";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { decodeOAuthState } from "@/lib/oauth-state";

type GoogleToken = { access_token?: string; error?: string };
type GoogleMe = {
  id?: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
};

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      return jsonError("Google API 키가 없습니다.", 503);
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const state = decodeOAuthState(searchParams.get("state"));
    const nextPath = state.next;
    const consented = Boolean(state.agreeTerms && state.agreePrivacy);

    if (oauthError || !code) {
      return NextResponse.redirect(
        `${getSiteUrl()}/login?error=google_denied`,
      );
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI?.trim() ||
      `${getSiteUrl()}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenJson = (await tokenRes.json()) as GoogleToken;
    if (!tokenJson.access_token) {
      return NextResponse.redirect(
        `${getSiteUrl()}/login?error=google_token`,
      );
    }

    const meRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenJson.access_token}` } },
    );
    const me = (await meRes.json()) as GoogleMe;
    const oauthId = me.id ?? "";
    if (!oauthId) {
      return NextResponse.redirect(`${getSiteUrl()}/login?error=google_user`);
    }

    const email =
      me.email?.toLowerCase() || `google_${oauthId}@oauth.jhmaker.local`;
    const name = me.name?.trim() || "Google 사용자";
    const now = new Date();

    let user = await prisma.user.findFirst({
      where: { oauthProvider: "google", oauthId },
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
            oauthProvider: "google",
            oauthId,
            emailVerifiedAt: byEmail.emailVerifiedAt ?? now,
            termsAgreedAt: byEmail.termsAgreedAt ?? now,
            privacyAgreedAt: byEmail.privacyAgreedAt ?? now,
            deletedAt: null,
          },
        });
      } else if (byEmail?.deletedAt) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            name,
            passwordHash: null,
            oauthProvider: "google",
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
            oauthProvider: "google",
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
        `${getSiteUrl()}/login?error=google_denied`,
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
