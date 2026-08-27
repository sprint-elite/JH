import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { confirmEmailVerification } from "@/lib/email-verify";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body.token?.trim() ?? "";
    if (!token) return jsonError("토큰이 필요합니다.", 400);
    const result = await confirmEmailVerification(token);
    if (!result.ok) return jsonError(result.error, 400);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
