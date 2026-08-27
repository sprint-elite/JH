import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { resetPasswordWithToken } from "@/lib/password-reset";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      token?: string;
      password?: string;
    };
    const token = body.token?.trim() ?? "";
    const password = body.password ?? "";
    if (!token) return jsonError("토큰이 필요합니다.", 400);

    const result = await resetPasswordWithToken(token, password);
    if (!result.ok) return jsonError(result.error, 400);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
