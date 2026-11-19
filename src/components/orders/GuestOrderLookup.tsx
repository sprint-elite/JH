"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { PublicOrderLookup } from "@/lib/order-lookup";
import { formatKRW } from "@/lib/pricing";

export function GuestOrderLookup({ signedIn }: { signedIn?: boolean }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PublicOrderLookup | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = (await res.json()) as {
        order?: PublicOrderLookup;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "조회에 실패했습니다.");
      if (!data.order) throw new Error("주문을 찾지 못했습니다.");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "조회에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900">비회원 주문조회</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        주문번호와 주문 시 입력한 이메일로 진행 상태를 확인할 수 있습니다.
        {signedIn ? (
          <>
            {" "}
            지금 브라우저에 로그인되어 있다면{" "}
            <Link href="/mypage" className="font-semibold text-rose-600 hover:underline">
              마이페이지
            </Link>
            에서도 볼 수 있어요.
          </>
        ) : (
          <>
            {" "}
            회원이시라면{" "}
            <Link href="/login?next=/mypage" className="font-semibold text-rose-600 hover:underline">
              로그인
            </Link>
            후 마이페이지에서 한눈에 확인하세요.
          </>
        )}
      </p>

      <form
        onSubmit={(e) => void submit(e)}
        className="mt-8 space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100"
      >
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">주문번호</span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="JH-2026-0001"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-rose-300"
            autoComplete="off"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-800">주문 이메일</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="order@example.com"
            className="mt-1.5 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-rose-300"
            autoComplete="email"
            required
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          조회하기
        </button>
      </form>

      {order ? (
        <div className="mt-6 space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-100">
          <p className="font-mono text-sm font-semibold text-zinc-900">
            {order.orderNumber}
          </p>
          <Row label="상품" value={`${order.productName} · ${order.quantity}장`} />
          <Row label="진행" value={order.statusLabel} />
          <Row label="결제" value={order.paymentLabel} />
          <Row
            label="송장"
            value={order.trackingNumber ?? "출고 전입니다"}
          />
          <Row label="결제 금액" value={formatKRW(order.totalPrice)} />
          <p className="pt-2 text-xs text-zinc-400">
            결제·배송지 변경이 필요하면 1:1 문의로 주문번호를 남겨 주세요.
          </p>
          <Link
            href="/inquiry?subject=주문 조회 문의"
            className="inline-flex text-sm font-semibold text-rose-600 hover:underline"
          >
            1:1 문의하기
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-medium text-zinc-800">{value}</span>
    </div>
  );
}
