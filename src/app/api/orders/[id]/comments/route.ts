import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import {
  assertOrderAccess,
  fetchOrderComments,
} from "@/lib/order-comments";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const order = await assertOrderAccess(
      id,
      user.id,
      user.role === "ADMIN",
    );
    if (!order) {
      return jsonError("주문을 찾을 수 없거나 접근 권한이 없습니다.", 404);
    }

    const comments = await fetchOrderComments(id);
    return NextResponse.json({ comments });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as { message?: string };

    const message = body.message?.trim();
    if (!message) {
      return jsonError("코멘트 내용을 입력해 주세요.", 400);
    }
    if (message.length > 2000) {
      return jsonError("코멘트는 2000자 이하로 입력해 주세요.", 400);
    }

    const order = await assertOrderAccess(
      id,
      user.id,
      user.role === "ADMIN",
    );
    if (!order) {
      return jsonError("주문을 찾을 수 없거나 접근 권한이 없습니다.", 404);
    }

    const row = await prisma.orderComment.create({
      data: {
        orderId: id,
        userId: user.id,
        message,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json(
      {
        comment: {
          id: row.id,
          orderId: row.orderId,
          userId: row.userId,
          authorName: row.user.name,
          authorRole: row.user.role,
          message: row.message,
          createdAt: row.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
