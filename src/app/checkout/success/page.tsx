"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function SuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [orderPath, setOrderPath] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setError("결제 정보가 누락되었습니다.");
      return;
    }

    let cancelled = false;

    async function confirm() {
      try {
        const res = await fetch("/api/payments/toss/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });
        const data = (await res.json()) as {
          order?: { id: string };
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? "결제 승인에 실패했습니다.");
        }
        if (cancelled) return;
        const path = data.order?.id
          ? `/mypage/orders/${data.order.id}`
          : "/mypage";
        setOrderPath(path);
        setTimeout(() => router.replace(path), 1500);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "결제 승인에 실패했습니다.",
          );
        }
      }
    }

    void confirm();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <ResultShell>
        <XCircle className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900">결제 승인 실패</h1>
        <p className="mt-2 text-sm text-zinc-600">{error}</p>
        <Link
          href="/mypage"
          className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          마이페이지로
        </Link>
      </ResultShell>
    );
  }

  return (
    <ResultShell>
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h1 className="mt-4 text-xl font-bold text-zinc-900">결제 완료</h1>
      <p className="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        주문을 확정하는 중입니다…
      </p>
      {orderPath ? (
        <Link
          href={orderPath}
          className="mt-6 inline-flex text-sm font-medium text-zinc-500 hover:text-zinc-800"
        >
          주문 상세로 이동
        </Link>
      ) : null}
    </ResultShell>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        {children}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <ResultShell>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-zinc-400" />
        </ResultShell>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
