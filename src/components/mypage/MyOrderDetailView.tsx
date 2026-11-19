"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { PAYMENT_STATUS_LABELS } from "@/lib/payment-status";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  formatTrackingDisplay,
  trackingLookupUrl,
} from "@/lib/tracking";
import type { Order } from "@/types";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MyOrderDetailViewProps {
  order: Order;
}

export function MyOrderDetailView({ order: initial }: MyOrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const info = useSiteSettings();

  const builderHref = `/builder?product=${order.productSlug}&order=${order.id}`;
  const canOpenBuilder = order.saleType === "CUSTOM";
  const tracking = formatTrackingDisplay(order.trackingNumber);
  const canCancel =
    order.status !== "CANCELLED" &&
    order.paymentStatus !== "PAID" &&
    (order.status === "PENDING" || order.status === "AWAITING_PAYMENT");

  const cancel = async () => {
    if (!confirm("이 주문을 취소할까요?")) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
      });
      const data = (await res.json()) as { order?: Order; error?: string };
      if (!res.ok) throw new Error(data.error ?? "취소에 실패했습니다.");
      if (data.order) setOrder(data.order);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "취소에 실패했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold text-zinc-900">
            {order.orderNumber}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-bold text-zinc-900">상품</h2>
        <p className="mt-3 text-base font-semibold text-zinc-900">
          {order.productName}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-400">구분</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.saleType === "CUSTOM" ? "커스텀" : "기성품"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">수량</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.quantity}개
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">결제 금액</dt>
            <dd className="mt-0.5 font-semibold text-zinc-900">
              {formatPrice(order.totalPrice)}
            </dd>
          </div>
          {order.paidAt ? (
            <div>
              <dt className="text-zinc-400">입금 확인</dt>
              <dd className="mt-0.5 font-medium text-zinc-800">
                {formatDate(order.paidAt)}
              </dd>
            </div>
          ) : null}
        </dl>
        {canOpenBuilder ? (
          <Link
            href={builderHref}
            className="mt-5 inline-flex rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            빌더에서 디자인 보기
          </Link>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-sm font-bold text-zinc-900">배송 정보</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-zinc-400">받는 분</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.shippingName ?? "-"} · {order.shippingPhone ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">주소</dt>
            <dd className="mt-0.5 font-medium text-zinc-800">
              {order.shippingZip ? `(${order.shippingZip}) ` : ""}
              {order.shippingAddress ?? "-"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-400">배송 추적</dt>
            <dd className="mt-0.5">
              {tracking ? (
                <a
                  href={trackingLookupUrl(tracking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-sky-700 hover:underline"
                >
                  송장 {tracking}
                  <ExternalLink className="h-3.5 w-3.5" />
                  배송조회
                </a>
              ) : (
                <span className="font-medium text-zinc-800">등록 전</span>
              )}
            </dd>
          </div>
          {order.notes?.trim() ? (
            <div>
              <dt className="text-zinc-400">요청사항</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-zinc-700">
                {order.notes}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      {order.paymentStatus === "UNPAID" && order.status !== "CANCELLED" ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold">결제 · 입금 안내</p>
          <p className="mt-2 leading-relaxed">
            카드·간편결제는 토스페이먼츠로 진행할 수 있습니다. 무통장 입금도
            가능합니다.
          </p>
          <Link
            href={`/checkout/${order.id}`}
            className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            결제하기
          </Link>
          <ul className="mt-4 space-y-1 font-medium">
            <li>무통장 계좌: {info.bankAccount}</li>
            <li>예금주: {info.bankHolder}</li>
            <li>입금자명: 주문자명과 동일하게 입력해 주세요</li>
          </ul>
          <p className="mt-3 text-amber-800/80">
            문의: {info.email} · {info.phone}
          </p>
        </section>
      ) : null}

      {canCancel ? (
        <button
          type="button"
          disabled={cancelling}
          onClick={() => void cancel()}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          주문 취소
        </button>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Link
        href="/mypage"
        className="inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        ← 주문 목록으로
      </Link>
    </div>
  );
}
