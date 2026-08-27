import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { issueEmailVerification } from "@/lib/email-verify";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const user = await requireUser();
    const db = await prisma.user.findUnique({ where: { id: user.id } });
    if (!db) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });
    if (db.emailVerifiedAt) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }
    const { verifyUrl } = await issueEmailVerification(db.id, db.email);
    return NextResponse.json({
      ok: true,
      message: "인증 링크를 발송했습니다. (테스트: 아래 URL)",
      verifyUrl,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
