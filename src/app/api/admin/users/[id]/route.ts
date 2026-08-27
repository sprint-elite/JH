import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchAdminUsers, isUserRole } from "@/lib/admin-users";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { role?: unknown };

    if (!isUserRole(body.role)) {
      return jsonError("권한이 올바르지 않습니다.", 400);
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return jsonError("계정을 찾을 수 없습니다.", 404);

    if (target.id === admin.id && body.role !== "ADMIN") {
      return jsonError("본인 관리자 권한은 해제할 수 없습니다.", 400);
    }

    if (target.role === "ADMIN" && body.role === "CUSTOMER") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return jsonError("마지막 관리자 계정은 권한을 해제할 수 없습니다.", 400);
      }
    }

    await prisma.user.update({
      where: { id },
      data: { role: body.role },
    });

    const users = await fetchAdminUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin();
    const { id } = await context.params;

    const target = await prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!target) return jsonError("계정을 찾을 수 없습니다.", 404);

    if (target.id === admin.id) {
      return jsonError("본인 계정은 삭제할 수 없습니다.", 400);
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return jsonError("마지막 관리자 계정은 삭제할 수 없습니다.", 400);
      }
    }

    if (target._count.orders > 0) {
      return jsonError(
        "주문이 있는 계정은 삭제할 수 없습니다. 권한만 변경해 주세요.",
        400,
      );
    }

    await prisma.user.delete({ where: { id } });
    const users = await fetchAdminUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
