import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { assertApiRateLimit } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/site-settings";
import { answerChat, parseChatPending } from "@/lib/chat/reply";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "chat", 80, 10 * 60 * 1000);
    const user = await getCurrentUser();
    const body = (await request.json()) as {
      message?: string;
      pending?: unknown;
    };

    const message = String(body.message ?? "").trim();
    if (!message) return jsonError("메시지를 입력해 주세요.", 400);
    if (message.length > 500) return jsonError("메시지가 너무 깁니다.", 400);

    const settings = await getSiteSettings();
    const reply = await answerChat({
      message,
      pending: parseChatPending(body.pending),
      userId: user?.id ?? null,
      settings,
    });

    return NextResponse.json(reply);
  } catch (err) {
    return handleApiError(err);
  }
}
