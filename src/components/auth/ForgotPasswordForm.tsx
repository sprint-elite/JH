"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        resetUrl?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "요청 실패");
      setMessage(data.message ?? "안내 메일을 확인하세요.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full max-w-sm space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">비밀번호 찾기</h1>
        <p className="mt-1 text-sm text-zinc-500">
          가입 이메일로 재설정 링크를 보냅니다. (테스트: 서버 로그 / 개발 URL)
        </p>
      </div>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {resetUrl && (
        <p className="break-all rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
          테스트 링크:{" "}
          <Link href={resetUrl} className="font-semibold underline">
            {resetUrl}
          </Link>
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        재설정 링크 받기
      </button>
      <Link href="/login" className="block text-center text-sm text-zinc-500">
        로그인으로
      </Link>
    </form>
  );
}
