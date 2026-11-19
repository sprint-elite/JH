import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { assertApiRateLimit } from "@/lib/rate-limit";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";
import { lookupOrderByNumberAndEmail } from "@/lib/order-lookup";

export async function POST(request: Request) {
  try {
    assertApiRateLimit(request, "orders-lookup", 20, 15 * 60 * 1000);
    const body = (await request.json()) as {
      orderNumber?: string;
      email?: string;
    };

    const orderNumber = body.orderNumber?.trim().toUpperCase() ?? "";
    if (!/^JH-\d{4}-\d{3,}$/.test(orderNumber)) {
      return jsonError("주문번호 형식이 올바르지 않습니다. 예: JH-2026-0001", 400);
    }

    const email = normalizeEmail(body.email ?? "");
    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    const order = await lookupOrderByNumberAndEmail(orderNumber, email);
    if (!order) {
      return jsonError("주문번호와 이메일이 일치하는 주문을 찾지 못했습니다.", 404);
    }

    return NextResponse.json({ order });
  } catch (err) {
    return handleApiError(err);
  }
}
