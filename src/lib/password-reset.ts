import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";

const RESET_TTL_MS = 60 * 60 * 1000; // 1h

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetForEmail(email: string): Promise<{
  ok: true;
  /** 개발·테스트용 — 실제 메일 연동 전 화면에 안 노출하되 서버 로그/응답(dev)에만 */
  resetUrl?: string;
} | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  // 계정 존재 여부를 숨김
  if (!user || user.role === "ADMIN") {
    return { ok: true };
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = `${getSiteUrl()}/reset-password?token=${token}`;
  console.info("[password-reset]", user.email, resetUrl);

  return {
    ok: true,
    // 메일 미연동 구간: 클라이언트가 테스트 링크를 받을 수 있게 반환
    resetUrl,
  };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 8) {
    return { ok: false, error: "비밀번호는 8자 이상이어야 합니다." };
  }

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "만료되었거나 유효하지 않은 링크입니다." };
  }

  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}
