"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Box,
  ChevronRight,
  ClipboardList,
  Factory,
  FolderTree,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PaymentStatusBadge } from "@/components/orders/PaymentStatusBadge";
import type { AdminDashboardData } from "@/lib/admin-dashboard";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { PAYMENT_STATUS_LABELS } from "@/lib/payment-status";
import type { Order } from "@/types";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatShortPrice(price: number) {
  if (price >= 10000) {
    return `${Math.round(price / 10000)}만`;
  }
  return new Intl.NumberFormat("ko-KR").format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

function todoReason(order: Order): string {
  if (order.paymentStatus === "UNPAID" && order.status !== "CANCELLED") {
    return "입금 확인 필요";
  }
  if (order.status === "CONFIRMED") return "제작 착수 대기";
  if (order.status === "SHIPPED" && !order.trackingNumber?.trim()) {
    return "송장번호 미입력";
  }
  return "처리 필요";
}

export function AdminDashboard({ data }: AdminDashboardProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const { summary, statusBreakdown, paymentBreakdown, dailyTrend, todoOrders, recentOrders, topProducts } =
    data;

  const maxTrendRevenue = useMemo(
    () => Math.max(...dailyTrend.map((d) => d.revenue), 1),
    [dailyTrend],
  );

  const maxStatusCount = useMemo(
    () => Math.max(...statusBreakdown.map((s) => s.count), 1),
    [statusBreakdown],
  );

  const pipelineTotal = useMemo(
    () => statusBreakdown.reduce((sum, s) => sum + s.count, 0),
    [statusBreakdown],
  );

  const kpiCards = [
    {
      label: "오늘 매출",
      value: formatPrice(summary.todayRevenue),
      sub: `주문 ${summary.todayOrders}건`,
      icon: TrendingUp,
      href: "/admin/orders",
      tone: "emerald",
    },
    {
      label: "이번 주",
      value: formatPrice(summary.weekRevenue),
      sub: `주문 ${summary.weekOrders}건`,
      icon: Banknote,
      href: "/admin/orders",
      tone: "blue",
    },
    {
      label: "미입금",
      value: `${summary.unpaidCount}건`,
      sub: formatPrice(summary.unpaidAmount),
      icon: AlertCircle,
      href: "/admin/orders?filter=unpaid",
      tone: "amber",
    },
    {
      label: "처리할 일",
      value: `${data.summary.todoCount}건`,
      sub: "입금·제작·송장",
      icon: ClipboardList,
      href: "/admin/orders",
      tone: "rose",
    },
    {
      label: "판매 상품",
      value: `${summary.activeProducts}개`,
      sub: `전체 ${summary.totalProducts}개`,
      icon: ShoppingBag,
      href: "/admin/products",
      tone: "slate",
    },
  ];

  const toneStyles = {
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      ring: "ring-emerald-100",
    },
    blue: { icon: "bg-blue-50 text-blue-600", ring: "ring-blue-100" },
    amber: { icon: "bg-amber-50 text-amber-600", ring: "ring-amber-100" },
    rose: { icon: "bg-rose-50 text-rose-600", ring: "ring-rose-100" },
    slate: { icon: "bg-slate-100 text-slate-600", ring: "ring-slate-100" },
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{formatHeaderDate()}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            운영 대시보드
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            매출·주문·상품 현황을 한 화면에서 확인하고 바로 처리하세요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/orders" icon={ClipboardList} label="주문 관리" />
          <QuickLink href="/admin/products" icon={ShoppingBag} label="상품 관리" />
          <QuickLink href="/" icon={ArrowUpRight} label="스토어 보기" external />
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const tone = toneStyles[card.tone as keyof typeof toneStyles];
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`group rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:border-slate-300 hover:shadow-md ${tone.ring}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                </div>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.icon}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-[11px] font-medium text-slate-400 group-hover:text-slate-600">
                자세히 보기
                <ArrowRight className="h-3 w-3" />
              </p>
            </Link>
          );
        })}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">최근 7일 매출</h2>
              <p className="text-xs text-slate-400">
                이번 달 누적 {formatPrice(summary.monthRevenue)}
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-700">
              총 {formatPrice(summary.totalRevenue)}
            </p>
          </div>
          <div className="flex h-40 items-end gap-2 sm:gap-3">
            {dailyTrend.map((day) => {
              const height = Math.max(8, (day.revenue / maxTrendRevenue) * 100);
              return (
                <div
                  key={day.date}
                  className="flex min-w-0 flex-1 flex-col items-center gap-2"
                >
                  <div className="flex w-full flex-1 flex-col justify-end">
                    <div
                      className="mx-auto w-full max-w-[48px] rounded-t-lg bg-slate-900 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${day.label}: ${formatPrice(day.revenue)} (${day.orders}건)`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-medium text-slate-500">
                      {day.label.split("(")[0]?.trim()}
                    </p>
                    <p className="text-[10px] tabular-nums text-slate-400">
                      {day.orders}건
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">운영 스냅샷</h2>
          <div className="mt-4 space-y-3">
            <SnapshotRow
              icon={Factory}
              label="제작 중"
              value={`${summary.inProductionCount}건`}
              href="/admin/orders"
            />
            <SnapshotRow
              icon={Truck}
              label="배송 중"
              value={`${summary.shippedCount}건`}
              href="/admin/orders"
            />
            <SnapshotRow
              icon={Users}
              label="가입 고객"
              value={`${summary.totalCustomers}명`}
              href="/admin/users"
            />
            <SnapshotRow
              icon={FolderTree}
              label="카테고리"
              value={`${summary.totalCategories}개`}
              href="/admin/categories"
            />
            <SnapshotRow
              icon={Package}
              label="누적 주문"
              value={`${summary.totalOrders}건`}
              href="/admin/orders"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm xl:col-span-1">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">처리할 일</h2>
                <p className="text-xs text-slate-400">우선 처리가 필요한 주문</p>
              </div>
              {todoOrders.length > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {todoOrders.length}
                </span>
              )}
            </div>
          </div>
          {todoOrders.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-slate-500">처리 대기 주문이 없습니다</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {todoOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="group flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50/80"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xs font-bold text-amber-700">
                      !
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {todoReason(order)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {order.shippingName ?? order.customerName} ·{" "}
                        {order.productName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatPrice(order.totalPrice)} ·{" "}
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-slate-100 px-5 py-3">
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              주문 목록에서 전체 처리 →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm xl:col-span-2">
          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
              <h2 className="text-sm font-semibold text-slate-900">주문 상태</h2>
              <p className="mb-4 text-xs text-slate-400">전체 {pipelineTotal}건</p>
              <div className="space-y-2.5">
                {statusBreakdown
                  .filter((s) => s.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          {ORDER_STATUS_LABELS[s.status]}
                        </span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {s.count}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-800"
                          style={{
                            width: `${(s.count / maxStatusCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-5">
              <h2 className="text-sm font-semibold text-slate-900">결제 현황</h2>
              <p className="mb-4 text-xs text-slate-400">입금·환불 상태</p>
              <div className="space-y-3">
                {paymentBreakdown
                  .filter((p) => p.count > 0)
                  .map((p) => (
                    <div
                      key={p.status}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
                    >
                      <span className="text-sm text-slate-600">
                        {PAYMENT_STATUS_LABELS[p.status]}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-slate-900">
                        {p.count}건
                      </span>
                    </div>
                  ))}
              </div>
              {topProducts.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-slate-900">
                    인기 상품
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {topProducts.slice(0, 4).map((p, i) => (
                      <li key={p.productId}>
                        <Link
                          href={p.slug ? `/products/${p.slug}` : "/admin/products"}
                          className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-slate-50"
                          target={p.slug ? "_blank" : undefined}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-bold text-slate-500">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-slate-700">
                            {p.productName}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-slate-400">
                            {p.orderCount}건 · {formatShortPrice(p.revenue)}원
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">최근 주문</h2>
            <p className="text-xs text-slate-400">방금 접수된 주문</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            전체 보기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Box className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">
              아직 접수된 주문이 없습니다
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-5 py-3 sm:px-6">주문번호</th>
                    <th className="px-3 py-3">고객</th>
                    <th className="px-3 py-3">상품</th>
                    <th className="px-3 py-3">금액</th>
                    <th className="px-3 py-3">입금</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">접수일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-slate-900 sm:px-6">
                        {order.orderNumber}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-slate-800">
                          {order.shippingName ?? order.customerName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.shippingPhone ?? ""}
                        </p>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-slate-600">
                        {order.productName}
                        <span className="ml-1 text-slate-400">×{order.quantity}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium tabular-nums text-slate-900">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-3 py-3">
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-3 py-3">
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 md:hidden">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-slate-50/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-slate-900">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-600">
                        {order.shippingName ?? order.customerName} ·{" "}
                        {order.productName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <PaymentStatusBadge status={order.paymentStatus} />
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatPrice(order.totalPrice)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
    >
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </Link>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-slate-900">
        {value}
      </span>
    </Link>
  );
}
