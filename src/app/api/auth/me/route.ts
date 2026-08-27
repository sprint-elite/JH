import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireUser, toPublicUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  validateName,
  validatePassword,
  validatePhone,
} from "@/lib/auth-validation";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const current = await requireUser();
    const body = (await request.json()) as {
      name?: string;
      phone?: string | null;
      currentPassword?: string;
      newPassword?: string;
    };

    const existing = await prisma.user.findUnique({
      where: { id: current.id },
    });
    if (!existing) return jsonError("사용자를 찾을 수 없습니다.", 404);

    const data: {
      name?: string;
      phone?: string | null;
      passwordHash?: string;
    } = {};

    if (body.name !== undefined) {
      const nameError = validateName(body.name);
      if (nameError) return jsonError(nameError, 400);
      data.name = body.name.trim();
    }

    if (body.phone !== undefined) {
      const phone = body.phone?.trim() || "";
      const phoneError = validatePhone(phone);
      if (phoneError) return jsonError(phoneError, 400);
      data.phone = phone || null;
    }

    if (body.newPassword) {
      if (!existing.passwordHash) {
        return jsonError("소셜/게스트 계정은 비밀번호를 변경할 수 없습니다.", 400);
      }
      if (!body.currentPassword) {
        return jsonError("현재 비밀번호를 입력해 주세요.", 400);
      }
      const ok = await bcrypt.compare(
        body.currentPassword,
        existing.passwordHash,
      );
      if (!ok) return jsonError("현재 비밀번호가 올바르지 않습니다.", 400);

      const passwordError = validatePassword(body.newPassword);
      if (passwordError) return jsonError(passwordError, 400);
      data.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    if (Object.keys(data).length === 0) {
      return jsonError("변경할 항목이 없습니다.", 400);
    }

    const user = await prisma.user.update({
      where: { id: current.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerifiedAt: true,
        pointsBalance: true,
        isGuest: true,
        createdAt: true,
      },
    });

    const response = NextResponse.json({
      user: toPublicUser(user),
    });

    if (data.name) {
      const token = await createSessionToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      const cookie = sessionCookieOptions(token);
      response.cookies.set(cookie.name, cookie.value, cookie);
    }

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
