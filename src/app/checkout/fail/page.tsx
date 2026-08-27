"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";

function FailInner() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const message =
    searchParams.get("message") ?? "결제가 취소되었거나 실패했습니다.";
  const orderId = searchParams.get("ref");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-xl font-bold text-zinc-900">결제 실패</h1>
        <p className="mt-2 text-sm text-zinc-600">{message}</p>
        {code ? (
          <p className="mt-1 font-mono text-xs text-zinc-400">{code}</p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {orderId ? (
            <Link
              href={`/checkout/${orderId}`}
              className="inline-flex justify-center rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white"
            >
              다시 결제하기
            </Link>
          ) : null}
          <Link
            href="/mypage"
            className="inline-flex justify-center rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-800"
          >
            마이페이지
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutFailPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh]" />}>
      <FailInner />
    </Suspense>
  );
}
