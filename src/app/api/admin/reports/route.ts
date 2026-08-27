import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(7, Number(searchParams.get("days")) || 30));

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        createdAt: true,
        totalPrice: true,
        paymentStatus: true,
        product: { select: { id: true, name: true, slug: true, saleType: true } },
      },
    });

    const byDay = new Map<string, { orders: number; revenue: number; paid: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, { orders: 0, revenue: 0, paid: 0 });
    }

    const byProduct = new Map<
      string,
      { name: string; slug: string; saleType: string; orders: number; revenue: number }
    >();

    let paidRevenue = 0;
    let unpaidAmount = 0;

    for (const o of orders) {
      const key = o.createdAt.toISOString().slice(0, 10);
      const day = byDay.get(key);
      if (day) {
        day.orders += 1;
        day.revenue += o.totalPrice;
        if (o.paymentStatus === "PAID") day.paid += o.totalPrice;
      }
      if (o.paymentStatus === "PAID") paidRevenue += o.totalPrice;
      if (o.paymentStatus === "UNPAID") unpaidAmount += o.totalPrice;

      const p = byProduct.get(o.product.id) ?? {
        name: o.product.name,
        slug: o.product.slug,
        saleType: o.product.saleType,
        orders: 0,
        revenue: 0,
      };
      p.orders += 1;
      p.revenue += o.totalPrice;
      byProduct.set(o.product.id, p);
    }

    const daily = [...byDay.entries()].map(([date, v]) => ({
      date,
      ...v,
    }));

    const products = [...byProduct.entries()]
      .map(([productId, v]) => ({ productId, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      rangeDays: days,
      summary: {
        orderCount: orders.length,
        grossRevenue: orders.reduce((s, o) => s + o.totalPrice, 0),
        paidRevenue,
        unpaidAmount,
      },
      daily,
      products,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
