import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchOrderDetailById } from "@/lib/orders";
import { parseBuilderPayload } from "@/lib/saved-design";
import type { AnnotationStatus } from "@/types/builder";

type RouteContext = { params: Promise<{ id: string }> };

const STATUSES = new Set<AnnotationStatus>(["open", "resolved"]);

/** 관리자만 — 고객 작업 요청(주석) 완료/재오픈 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN") {
      return jsonError("관리자만 작업 요청을 완료 처리할 수 있습니다.", 403);
    }

    const { id: orderId } = await context.params;
    const body = (await request.json()) as {
      annotationId?: string;
      status?: AnnotationStatus;
    };

    if (!body.annotationId || typeof body.annotationId !== "string") {
      return jsonError("annotationId가 필요합니다.", 400);
    }
    if (!body.status || !STATUSES.has(body.status)) {
      return jsonError("status는 open 또는 resolved 여야 합니다.", 400);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, designId: true },
    });
    if (!order?.designId) {
      return jsonError("연결된 작업물이 없습니다.", 404);
    }

    const design = await prisma.design.findUnique({
      where: { id: order.designId },
    });
    if (!design) {
      return jsonError("작업물을 찾을 수 없습니다.", 404);
    }

    const payload = parseBuilderPayload(design.builderJson);
    if (!payload) {
      return jsonError("작업물 데이터가 올바르지 않습니다.", 400);
    }

    const idx = payload.annotations.findIndex((a) => a.id === body.annotationId);
    if (idx < 0) {
      return jsonError("작업 요청을 찾을 수 없습니다.", 404);
    }

    const nextAnnotations = payload.annotations.map((a, i) =>
      i === idx ? { ...a, status: body.status! } : a,
    );
    const nextPayload = { ...payload, annotations: nextAnnotations };

    await prisma.design.update({
      where: { id: design.id },
      data: {
        builderJson: nextPayload as unknown as Prisma.InputJsonValue,
      },
    });

    const detail = await fetchOrderDetailById(orderId);
    return NextResponse.json({ order: detail });
  } catch (err) {
    return handleApiError(err);
  }
}
