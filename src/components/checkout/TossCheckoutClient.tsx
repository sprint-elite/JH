"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { Loader2 } from "lucide-react";
import { SITE_INFO } from "@/lib/site-info";
import { formatKRW } from "@/lib/pricing";

type PreparePayload = {
  clientKey: string;
  testMode: boolean;
  tossOrderId: string;
  amount: number;
  orderName: string;
  orderNumber: string;
  customerKey: string;
  customerName: string;
  customerEmail: string;
};

interface TossCheckoutClientProps {
  orderId: string;
  orderNumber: string;
  productName: string;
  totalPrice: number;
  shippingFee: number;
  couponDiscount: number;
  pointsUsed: number;
  pointsBalance: number;
  shippingName: string | null;
  bankAccount: string;
  bankHolder: string;
}

export function TossCheckoutClient({
  orderId,
  orderNumber,
  productName,
  totalPrice: initialTotal,
  shippingFee,
  couponDiscount: initialCoupon,
  pointsUsed: initialPoints,
  pointsBalance: initialBalance,
  shippingName,
  bankAccount,
  bankHolder,
}: TossCheckoutClientProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [totalPrice, setTotalPrice] = useState(initialTotal);
  const [couponDiscount, setCouponDiscount] = useState(initialCoupon);
  const [pointsUsed, setPointsUsed] = useState(initialPoints);
  const [pointsBalance, setPointsBalance] = useState(initialBalance);
  const [couponCode, setCouponCode] = useState("");
  const [pointsInput, setPointsInput] = useState(String(initialPoints || ""));
  const widgetsRef = useRef<Awaited<
    ReturnType<Awaited<ReturnType<typeof loadTossPayments>>["widgets"]>
  > | null>(null);
  const preparedRef = useRef<PreparePayload | null>(null);

  const merchandise =
    totalPrice - shippingFee + couponDiscount + pointsUsed;

  const reinitWidgets = async () => {
    setReady(false);
    widgetsRef.current = null;
    const prepRes = await fetch("/api/payments/toss/prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const prep = (await prepRes.json()) as PreparePayload & { error?: string };
    if (!prepRes.ok) throw new Error(prep.error ?? "결제 준비 실패");
    preparedRef.current = prep;
    setTestMode(prep.testMode);
    setTotalPrice(prep.amount);

    const tossPayments = await loadTossPayments(prep.clientKey);
    const widgets = tossPayments.widgets({
      customerKey: prep.customerKey || ANONYMOUS,
    });
    await widgets.setAmount({ currency: "KRW", value: prep.amount });
    const methodsEl = document.querySelector("#toss-payment-methods");
    if (methodsEl) methodsEl.innerHTML = "";
    const agreeEl = document.querySelector("#toss-agreement");
    if (agreeEl) agreeEl.innerHTML = "";
    await Promise.all([
      widgets.renderPaymentMethods({
        selector: "#toss-payment-methods",
        variantKey: "DEFAULT",
      }),
      widgets.renderAgreement({
        selector: "#toss-agreement",
        variantKey: "AGREEMENT",
      }),
    ]);
    widgetsRef.current = widgets;
    setReady(true);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reinitWidgets();
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "결제 UI를 불러오지 못했습니다.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const applyDiscounts = async () => {
    setDiscountBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponCode.trim() || null,
          pointsToUse: Number(pointsInput) || 0,
          clearCoupon: !couponCode.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        order?: {
          totalPrice: number;
          couponDiscount?: number;
          pointsUsed?: number;
        };
        pointsBalance?: number;
      };
      if (!res.ok) throw new Error(data.error ?? "할인 적용 실패");
      if (data.order) {
        setTotalPrice(data.order.totalPrice);
        setCouponDiscount(data.order.couponDiscount ?? 0);
        setPointsUsed(data.order.pointsUsed ?? 0);
        setPointsInput(String(data.order.pointsUsed ?? 0));
      }
      if (typeof data.pointsBalance === "number") {
        setPointsBalance(data.pointsBalance);
      }
      await reinitWidgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : "할인 적용 실패");
    } finally {
      setDiscountBusy(false);
    }
  };

  const handlePay = async () => {
    const widgets = widgetsRef.current;
    const prepared = preparedRef.current;
    if (!widgets || !prepared) return;

    setPaying(true);
    setError(null);
    try {
      const origin = window.location.origin;
      await widgets.requestPayment({
        orderId: prepared.tossOrderId,
        orderName: prepared.orderName,
        successUrl: `${origin}/checkout/success`,
        failUrl: `${origin}/checkout/fail?ref=${encodeURIComponent(orderId)}`,
        customerEmail: prepared.customerEmail,
        customerName: prepared.customerName || shippingName || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "결제 요청에 실패했습니다.",
      );
      setPaying(false);
    }
  };

  const handleBankTransfer = async () => {
    setBankBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/bank-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "처리에 실패했습니다.");
      router.push(`/mypage/orders/${orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리에 실패했습니다.");
      setBankBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
          Checkout
        </p>
        <h1 className="mt-1 text-2xl font-bold text-zinc-900">결제하기</h1>
        <p className="mt-2 text-sm text-zinc-500">
          주문번호{" "}
          <span className="font-mono font-semibold text-zinc-800">
            {orderNumber}
          </span>
        </p>
      </div>

      {testMode ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p className="font-semibold">토스페이먼츠 테스트 모드</p>
          <p className="mt-1 text-sky-800/90">
            실제 금액이 청구되지 않습니다.
          </p>
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-sm font-semibold text-zinc-900">{productName}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-zinc-600">
          <div className="flex justify-between">
            <dt>상품</dt>
            <dd>{formatKRW(merchandise)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>배송비</dt>
            <dd>{shippingFee === 0 ? "무료" : formatKRW(shippingFee)}</dd>
          </div>
          {couponDiscount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>쿠폰</dt>
              <dd>-{formatKRW(couponDiscount)}</dd>
            </div>
          )}
          {pointsUsed > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>포인트</dt>
              <dd>-{formatKRW(pointsUsed)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-4">
          <span className="text-sm text-zinc-500">결제 금액</span>
          <span className="text-xl font-bold text-zinc-900">
            {formatKRW(totalPrice)}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-bold text-zinc-900">쿠폰 · 포인트</h2>
        <div className="mt-3 space-y-3">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="쿠폰 코드"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
          />
          <div>
            <label className="mb-1 block text-xs text-zinc-500">
              포인트 사용 (보유 {pointsBalance.toLocaleString()}P)
            </label>
            <input
              type="number"
              min={0}
              max={pointsBalance}
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="button"
            disabled={discountBusy || paying || bankBusy}
            onClick={() => void applyDiscounts()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
          >
            {discountBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            할인 적용
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-bold text-zinc-900">토스페이먼츠</h2>
        {!ready && !error ? (
          <div className="flex items-center gap-2 py-10 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            결제수단 불러오는 중…
          </div>
        ) : null}
        <div id="toss-payment-methods" className="mt-3 min-h-[120px]" />
        <div id="toss-agreement" className="mt-3" />
        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={!ready || paying || bankBusy || discountBusy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {formatKRW(totalPrice)} 결제하기
        </button>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <h2 className="text-sm font-bold text-zinc-900">무통장 입금</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          계좌: {bankAccount || SITE_INFO.bankAccount} / 예금주{" "}
          {bankHolder || SITE_INFO.bankHolder}
        </p>
        <button
          type="button"
          onClick={() => void handleBankTransfer()}
          disabled={paying || bankBusy || discountBusy}
          className="mt-4 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
        >
          {bankBusy ? "처리 중…" : "무통장으로 주문 확정"}
        </button>
      </section>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Link
        href={`/mypage/orders/${orderId}`}
        className="inline-flex text-sm text-zinc-500 hover:text-zinc-800"
      >
        ← 나중에 결제하기
      </Link>
    </div>
  );
}
