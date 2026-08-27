import { prisma } from "@/lib/db";
import { toOrderDto } from "@/lib/orders";
import type { Order, OrderStatus } from "@/types";
import type { PaymentStatus } from "@/lib/payment-status";

export type DailyTrendPoint = {
  date: string;
  label: string;
  orders: number;
  revenue: number;
};

export type StatusBreakdown = {
  status: OrderStatus;
  count: number;
};

export type PaymentBreakdown = {
  status: PaymentStatus;
  count: number;
};

export type TopProductRow = {
  productId: string;
  productName: string;
  slug: string;
  orderCount: number;
  revenue: number;
};

export type AdminDashboardData = {
  summary: {
    todayOrders: number;
    todayRevenue: number;
    weekOrders: number;
    weekRevenue: number;
    monthRevenue: number;
    totalOrders: number;
    totalRevenue: number;
    unpaidCount: number;
    unpaidAmount: number;
    todoCount: number;
    inProductionCount: number;
    shippedCount: number;
    activeProducts: number;
    totalProducts: number;
    totalCustomers: number;
    totalCategories: number;
  };
  statusBreakdown: StatusBreakdown[];
  paymentBreakdown: PaymentBreakdown[];
  dailyTrend: DailyTrendPoint[];
  todoOrders: Order[];
  recentOrders: Order[];
  topProducts: TopProductRow[];
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

function formatDayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  });
}

function isTodoOrder(o: {
  paymentStatus: string;
  status: string;
  trackingNumber: string | null;
}) {
  if (o.paymentStatus === "UNPAID" && o.status !== "CANCELLED") return true;
  if (o.status === "CONFIRMED") return true;
  if (o.status === "SHIPPED" && !o.trackingNumber?.trim()) return true;
  return false;
}

const orderInclude = {
  user: { select: { id: true, name: true, email: true } },
  product: { select: { id: true, name: true, slug: true, saleType: true } },
  items: true,
} as const;

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const today = startOfDay();
  const week = startOfWeek();
  const month = startOfMonth();
  const trendStart = daysAgo(6);

  const notCancelled = { status: { not: "CANCELLED" as const } };

  const [
    todayOrders,
    todayRevenueAgg,
    weekOrders,
    weekRevenueAgg,
    monthRevenueAgg,
    totalRevenueAgg,
    totalOrders,
    unpaidAgg,
    unpaidAmountAgg,
    inProductionCount,
    shippedCount,
    activeProducts,
    totalProducts,
    totalCustomers,
    totalCategories,
    statusGroups,
    paymentGroups,
    recentRaw,
    todoCandidates,
    trendRaw,
    topGrouped,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: { gte: today }, ...notCancelled },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: today }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: week }, ...notCancelled },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: week }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: { createdAt: { gte: month }, ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.aggregate({
      where: notCancelled,
      _sum: { totalPrice: true },
    }),
    prisma.order.count(),
    prisma.order.count({
      where: { paymentStatus: "UNPAID", ...notCancelled },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: "UNPAID", ...notCancelled },
      _sum: { totalPrice: true },
    }),
    prisma.order.count({ where: { status: "IN_PRODUCTION" } }),
    prisma.order.count({ where: { status: "SHIPPED" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.category.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { paymentStatus: "UNPAID", status: { not: "CANCELLED" } },
          { status: "CONFIRMED" },
          { status: "SHIPPED", OR: [{ trackingNumber: null }, { trackingNumber: "" }] },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 12,
      include: orderInclude,
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: trendStart }, ...notCancelled },
      select: { createdAt: true, totalPrice: true },
    }),
    prisma.order.groupBy({
      by: ["productId"],
      where: notCancelled,
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  const productIds = topGrouped.map((g) => g.productId);
  const productRows =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  const topProducts: TopProductRow[] = topGrouped.map((g) => {
    const p = productMap.get(g.productId);
    return {
      productId: g.productId,
      productName: p?.name ?? "알 수 없음",
      slug: p?.slug ?? "",
      orderCount: g._count.id,
      revenue: g._sum.totalPrice ?? 0,
    };
  });

  const trendBuckets = new Map<string, { orders: number; revenue: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    trendBuckets.set(key, { orders: 0, revenue: 0 });
  }
  for (const row of trendRaw) {
    const key = startOfDay(row.createdAt).toISOString().slice(0, 10);
    const bucket = trendBuckets.get(key);
    if (bucket) {
      bucket.orders += 1;
      bucket.revenue += row.totalPrice;
    }
  }
  const dailyTrend: DailyTrendPoint[] = [...trendBuckets.entries()].map(
    ([date, v]) => ({
      date,
      label: formatDayLabel(date),
      orders: v.orders,
      revenue: v.revenue,
    }),
  );

  const todoDtos = todoCandidates.map(toOrderDto).filter(isTodoOrder);
  const todoOrders = todoDtos.slice(0, 8);

  return {
    summary: {
      todayOrders,
      todayRevenue: todayRevenueAgg._sum.totalPrice ?? 0,
      weekOrders,
      weekRevenue: weekRevenueAgg._sum.totalPrice ?? 0,
      monthRevenue: monthRevenueAgg._sum.totalPrice ?? 0,
      totalOrders,
      totalRevenue: totalRevenueAgg._sum.totalPrice ?? 0,
      unpaidCount: unpaidAgg,
      unpaidAmount: unpaidAmountAgg._sum.totalPrice ?? 0,
      todoCount: todoDtos.length,
      inProductionCount,
      shippedCount,
      activeProducts,
      totalProducts,
      totalCustomers,
      totalCategories,
    },
    statusBreakdown: statusGroups.map((g) => ({
      status: g.status as OrderStatus,
      count: g._count.id,
    })),
    paymentBreakdown: paymentGroups.map((g) => ({
      status: g.paymentStatus as PaymentStatus,
      count: g._count.id,
    })),
    dailyTrend,
    todoOrders,
    recentOrders: recentRaw.map(toOrderDto),
    topProducts,
  };
}
