"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function Inner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMessage("유효하지 않은 링크입니다.");
      return;
    }
    void fetch("/api/auth/verify-email/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "인증 실패");
        setStatus("ok");
        setMessage("이메일 인증이 완료되었습니다.");
      })
      .catch((err: Error) => {
        setStatus("err");
        setMessage(err.message);
      });
  }, [token]);

  return (
    <div className="w-full max-w-sm text-center">
      {status === "idle" && (
        <p className="flex items-center justify-center gap-2 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" /> 인증 처리 중…
        </p>
      )}
      {status !== "idle" && (
        <>
          <h1 className="text-xl font-bold text-zinc-900">
            {status === "ok" ? "인증 완료" : "인증 실패"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{message}</p>
          <Link
            href="/mypage/profile"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            내 정보로
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Suspense>
        <Inner />
      </Suspense>
    </main>
  );
}
