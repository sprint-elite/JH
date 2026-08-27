import { prisma } from "@/lib/db";
import type { OrderComment } from "@/types";

export async function fetchOrderComments(
  orderId: string,
): Promise<OrderComment[]> {
  const rows = await prisma.orderComment.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    orderId: row.orderId,
    userId: row.userId,
    authorName: row.user.name,
    authorRole: row.user.role,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function assertOrderAccess(
  orderId: string,
  userId: string,
  isAdmin: boolean,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  if (!order) return null;
  if (!isAdmin && order.userId !== userId) return null;
  return order;
}
