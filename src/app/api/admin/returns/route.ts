import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        order: {
          select: {
            orderNumber: true,
            product: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json({
      returns: rows.map((r) => ({
        id: r.id,
        type: r.type,
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        productName: r.order.product.name,
        userName: r.user.name,
        userEmail: r.user.email,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
