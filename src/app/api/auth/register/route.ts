import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  normalizeEmail,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/auth-validation";
import { assertAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertAuthRateLimit(request, "register");

    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
      phone?: string;
      agreeTerms?: boolean;
      agreePrivacy?: boolean;
    };

    if (!body.agreeTerms || !body.agreePrivacy) {
      return jsonError("이용약관 및 개인정보 처리방침에 동의해 주세요.", 400);
    }

    const email = normalizeEmail(body.email ?? "");
    const password = body.password ?? "";
    const name = body.name ?? "";
    const phone = body.phone?.trim() ?? "";

    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    const nameError = validateName(name);
    if (nameError) return jsonError(nameError, 400);

    const passwordError = validatePassword(password);
    if (passwordError) return jsonError(passwordError, 400);

    const phoneError = validatePhone(phone);
    if (phoneError) return jsonError(phoneError, 400);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      return jsonError("이미 가입된 이메일입니다.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const user = existing?.deletedAt
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name: name.trim(),
            phone: phone || null,
            passwordHash,
            role: "CUSTOMER",
            isGuest: false,
            deletedAt: null,
            termsAgreedAt: now,
            privacyAgreedAt: now,
            emailVerifiedAt: null,
            oauthProvider: null,
            oauthId: null,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            name: name.trim(),
            phone: phone || null,
            passwordHash,
            role: "CUSTOMER",
            termsAgreedAt: now,
            privacyAgreedAt: now,
          },
        });

    const { issueEmailVerification } = await import("@/lib/email-verify");
    const { verifyUrl } = await issueEmailVerification(user.id, user.email);

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt.toISOString(),
        },
        verifyUrl,
      },
      { status: 201 },
    );

    const cookie = sessionCookieOptions(token);
    response.cookies.set(cookie.name, cookie.value, cookie);

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
