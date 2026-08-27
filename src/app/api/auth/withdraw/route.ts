import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { clearSessionCookieOptions } from "@/lib/session";

/** 회원 탈퇴 — 소프트 삭제 + 세션 종료 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (user.role === "ADMIN") {
      return jsonError("관리자 계정은 탈퇴할 수 없습니다.", 400);
    }

    const body = (await request.json().catch(() => ({}))) as {
      confirm?: string;
    };
    if (body.confirm !== "탈퇴") {
      return jsonError('확인을 위해 confirm 값으로 "탈퇴"를 보내 주세요.', 400);
    }

    const stamp = Date.now();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        deletedAt: new Date(),
        email: `deleted_${stamp}_${user.id.slice(0, 8)}@deleted.local`,
        name: "탈퇴회원",
        phone: null,
        passwordHash: null,
        oauthProvider: null,
        oauthId: null,
        pointsBalance: 0,
      },
    });

    const response = NextResponse.json({ ok: true });
    const cleared = clearSessionCookieOptions();
    response.cookies.set(cleared.name, cleared.value, cleared);
    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
