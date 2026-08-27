import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { assertAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertAuthRateLimit(request, "login");

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return jsonError("이메일과 비밀번호를 입력하세요.", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.deletedAt) {
      return jsonError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return jsonError("이메일 또는 비밀번호가 올바르지 않습니다.", 401);
    }
    if (user.isGuest) {
      return jsonError("게스트 계정은 비밀번호 로그인을 사용할 수 없습니다.", 401);
    }

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });

    const cookie = sessionCookieOptions(token);
    response.cookies.set(cookie.name, cookie.value, cookie);

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
