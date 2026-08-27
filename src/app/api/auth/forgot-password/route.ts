import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { createPasswordResetForEmail } from "@/lib/password-reset";
import { notify } from "@/lib/notify";
import { assertAuthRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertAuthRateLimit(request, "forgot");

    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || !email.includes("@")) {
      return jsonError("이메일을 입력해 주세요.", 400);
    }

    const result = await createPasswordResetForEmail(email);
    if (!result.ok) return jsonError(result.error, 400);

    if (result.resetUrl) {
      await notify({
        type: "PASSWORD_RESET",
        toEmail: email,
        subject: "비밀번호 재설정",
        body: result.resetUrl,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "가입된 이메일이라면 재설정 안내가 발송됩니다. (테스트: 서버 로그 확인)",
      ...(process.env.NODE_ENV !== "production" && result.resetUrl
        ? { resetUrl: result.resetUrl }
        : {}),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
