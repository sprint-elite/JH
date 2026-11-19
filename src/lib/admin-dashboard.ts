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

/** MES — 재작업률·수주출하 리드타임 */
export type MesMonthlyReworkPoint = {
  monthKey: string;
  label: string;
  totalWorkOrders: number;
  commentWorkOrders: number;
};

export type MesMonthlyLeadTimePoint = {
  monthKey: string;
  label: string;
  /** 출하 샘플 없으면 0 */
  avgLeadTimeHours: number;
  sampleCount: number;
};

export type MesKpiMetrics = {
  /** 고객 코멘트가 있는 작업건 / 등록 작업건 × 100 */
  reworkRatePercent: number | null;
  reworkOrderCount: number;
  totalWorkOrderCount: number;
  /** 주문 등록 → 배송 중(SHIPPED) 전환 평균 시간(시간) */
  avgLeadTimeHours: number | null;
  leadTimeSampleCount: number;
  targetReworkRatePercent: number;
  targetLeadTimeHours: number;
  /** 차트: 최근 6개월 */
  reworkMonthly: MesMonthlyReworkPoint[];
  leadTimeMonthly: MesMonthlyLeadTimePoint[];
  /** 리드타임 차트 기준선(시간) */
  leadTimeReferenceHours: number;
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
  mesKpi: MesKpiMetrics;
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

const registeredWorkWhere = {
  designId: { not: null },
  status: { not: "CANCELLED" as const },
};

import { MES_CHART_MONTHS } from "@/lib/admin-dashboard-charts";

/** 리드타임 차트 y축 기준 점선(시간) */
const LEAD_TIME_REFERENCE_HOURS = 168;

function monthKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastMonths(count: number) {
  const now = new Date();
  const rows: {
    monthKey: string;
    label: string;
    start: Date;
    end: Date;
  }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    rows.push({
      monthKey: monthKeyFromDate(start),
      label: start.toLocaleDateString("ko-KR", { month: "short" }),
      start,
      end,
    });
  }
  return rows;
}

function orderHasCustomerComment(o: {
  userId: string;
  comments: { userId: string }[];
}) {
  return o.comments.some((c) => c.userId === o.userId);
}

async function fetchMesKpiMetrics(): Promise<MesKpiMetrics> {
  const targetReworkRatePercent = 3;
  const targetLeadTimeHours = 72;
  const monthBuckets = lastMonths(MES_CHART_MONTHS);
  const chartRangeStart = monthBuckets[0]?.start ?? startOfMonth();

  const [
    totalWorkOrderCount,
    workOrdersWithComments,
    leadSamples,
    chartWorkOrders,
    chartLeadSamples,
  ] = await Promise.all([
    prisma.order.count({ where: registeredWorkWhere }),
    prisma.order.findMany({
      where: registeredWorkWhere,
      select: {
        userId: true,
        comments: { select: { userId: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        shippedAt: { not: null },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
      select: { createdAt: true, shippedAt: true },
    }),
    prisma.order.findMany({
      where: {
        ...registeredWorkWhere,
        createdAt: { gte: chartRangeStart },
      },
      select: {
        createdAt: true,
        userId: true,
        comments: { select: { userId: true } },
      },
    }),
    prisma.order.findMany({
      where: {
        shippedAt: { not: null, gte: chartRangeStart },
        status: { in: ["SHIPPED", "DELIVERED"] },
      },
      select: { createdAt: true, shippedAt: true },
    }),
  ]);

  const reworkOrderCount = workOrdersWithComments.filter((o) =>
    orderHasCustomerComment(o),
  ).length;

  const reworkRatePercent =
    totalWorkOrderCount > 0
      ? Math.round((reworkOrderCount / totalWorkOrderCount) * 1000) / 10
      : null;

  let avgLeadTimeHours: number | null = null;
  if (leadSamples.length > 0) {
    const totalMs = leadSamples.reduce((sum, row) => {
      const end = row.shippedAt!.getTime();
      const start = row.createdAt.getTime();
      return sum + Math.max(0, end - start);
    }, 0);
    avgLeadTimeHours =
      Math.round((totalMs / leadSamples.length / (1000 * 60 * 60)) * 10) / 10;
  }

  const reworkMonthly: MesMonthlyReworkPoint[] = monthBuckets.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    totalWorkOrders: 0,
    commentWorkOrders: 0,
  }));
  const reworkIndex = new Map(reworkMonthly.map((r, i) => [r.monthKey, i]));

  for (const row of chartWorkOrders) {
    const key = monthKeyFromDate(row.createdAt);
    const idx = reworkIndex.get(key);
    if (idx === undefined) continue;
    reworkMonthly[idx].totalWorkOrders += 1;
    if (orderHasCustomerComment(row)) {
      reworkMonthly[idx].commentWorkOrders += 1;
    }
  }

  const leadTimeMonthly: MesMonthlyLeadTimePoint[] = monthBuckets.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    avgLeadTimeHours: 0,
    sampleCount: 0,
  }));
  const leadIndex = new Map(leadTimeMonthly.map((r, i) => [r.monthKey, i]));

  for (const row of chartLeadSamples) {
    const shipped = row.shippedAt!;
    const key = monthKeyFromDate(shipped);
    const idx = leadIndex.get(key);
    if (idx === undefined) continue;
    const hours =
      Math.max(0, shipped.getTime() - row.createdAt.getTime()) /
      (1000 * 60 * 60);
    const bucket = leadTimeMonthly[idx];
    const prevTotal = bucket.avgLeadTimeHours * bucket.sampleCount;
    bucket.sampleCount += 1;
    bucket.avgLeadTimeHours =
      Math.round(((prevTotal + hours) / bucket.sampleCount) * 10) / 10;
  }

  return {
    reworkRatePercent,
    reworkOrderCount,
    totalWorkOrderCount,
    avgLeadTimeHours,
    leadTimeSampleCount: leadSamples.length,
    targetReworkRatePercent,
    targetLeadTimeHours,
    reworkMonthly,
    leadTimeMonthly,
    leadTimeReferenceHours: LEAD_TIME_REFERENCE_HOURS,
  };
}

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
    mesKpi,
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
    fetchMesKpiMetrics(),
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
    mesKpi,
  };
}
