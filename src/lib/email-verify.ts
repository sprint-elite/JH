import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getSiteUrl } from "@/lib/site-url";
import { notify } from "@/lib/notify";
import { brandedMailSubject } from "@/lib/site-settings";

const TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function issueEmailVerification(userId: string, email: string) {
  await prisma.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  const verifyUrl = `${getSiteUrl()}/verify-email?token=${token}`;
  console.info("[email-verify]", email, verifyUrl);
  void notify({
    type: "PASSWORD_RESET",
    toEmail: email,
    subject: await brandedMailSubject("이메일 인증"),
    body: verifyUrl,
  });

  return { verifyUrl };
}

export async function confirmEmailVerification(token: string) {
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, error: "만료되었거나 유효하지 않은 링크입니다." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}
