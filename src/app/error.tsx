"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-400">오류</p>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">
        일시적인 문제가 발생했습니다
      </h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        잠시 후 다시 시도해 주세요. 문제가 계속되면 고객센터로 문의해 주세요.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
