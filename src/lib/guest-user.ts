import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSessionToken, sessionCookieOptions } from "@/lib/session";

export async function resolveGuestUser(opts: {
  email: string;
  name: string;
  phone?: string | null;
}) {
  const existing = await prisma.user.findUnique({ where: { email: opts.email } });
  if (existing && !existing.isGuest && !existing.deletedAt) {
    const err = new Error(
      "이미 가입된 이메일입니다. 로그인 후 주문해 주세요.",
    ) as Error & { status: number };
    err.status = 409;
    throw err;
  }

  const name = opts.name.trim() || "게스트";
  const phone = opts.phone?.trim() || null;

  if (existing?.isGuest) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        phone: phone || existing.phone,
        deletedAt: null,
      },
    });
  }

  return prisma.user.create({
    data: {
      email: opts.email,
      name,
      phone,
      passwordHash: null,
      isGuest: true,
      role: "CUSTOMER",
    },
  });
}

export async function attachGuestSession(
  response: NextResponse,
  user: { id: string; email: string; name: string; role: "CUSTOMER" | "ADMIN" },
) {
  const session = await createSessionToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const cookie = sessionCookieOptions(session);
  response.cookies.set(cookie.name, cookie.value, cookie);
  return response;
}
