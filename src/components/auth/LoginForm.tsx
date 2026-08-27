"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const OAUTH_ERRORS: Record<string, string> = {
  kakao_denied: "카카오 로그인이 취소되었습니다.",
  kakao_token: "카카오 토큰 발급에 실패했습니다.",
  kakao_user: "카카오 사용자 정보를 가져오지 못했습니다.",
  kakao_config: "카카오 로그인이 설정되지 않았습니다. (KAKAO_REST_API_KEY)",
  google_denied: "Google 로그인이 취소되었습니다.",
  google_token: "Google 토큰 발급에 실패했습니다.",
  google_user: "Google 사용자 정보를 가져오지 못했습니다.",
  google_config: "Google 로그인이 설정되지 않았습니다. (GOOGLE_CLIENT_ID)",
  oauth_consent:
    "처음 소셜로 가입하려면 이용약관·개인정보 처리방침에 동의해 주세요.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const oauthError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthError ? (OAUTH_ERRORS[oauthError] ?? "로그인에 실패했습니다.") : null,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: { role: string };
      };
      if (!res.ok) throw new Error(data.error ?? "로그인에 실패했습니다.");
      const destination =
        nextParam ?? (data.user?.role === "ADMIN" ? "/admin" : "/");
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  const buildOAuthHref = (provider: "kakao" | "google") => {
    const params = new URLSearchParams();
    if (nextParam) params.set("next", nextParam);
    if (agreeTerms) params.set("agreeTerms", "1");
    if (agreePrivacy) params.set("agreePrivacy", "1");
    const q = params.toString();
    return `/api/auth/${provider}${q ? `?${q}` : ""}`;
  };

  const onSocialClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (oauthError === "oauth_consent" && (!agreeTerms || !agreePrivacy)) {
      e.preventDefault();
      setError(OAUTH_ERRORS.oauth_consent);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">로그인</h1>
        <p className="mt-2 text-sm text-zinc-500">
          고객 계정으로 로그인하면 본인 작업물만 저장·불러올 수 있습니다.
        </p>

        <div className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-3 text-sm">
          <p className="text-xs text-zinc-500">
            소셜로 <span className="font-medium text-zinc-700">처음 가입</span>
            하는 경우 아래 동의가 필요합니다. 기존 회원은 바로 로그인됩니다.
          </p>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1"
            />
            <span>
              <Link href="/terms" target="_blank" className="underline">
                이용약관
              </Link>
              에 동의합니다
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              className="mt-1"
            />
            <span>
              <Link href="/privacy" target="_blank" className="underline">
                개인정보 처리방침
              </Link>
              에 동의합니다
            </span>
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <a
            href={buildOAuthHref("kakao")}
            onClick={onSocialClick}
            className="flex w-full items-center justify-center rounded-lg bg-[#FEE500] py-2.5 text-sm font-semibold text-[#191919]"
          >
            카카오로 계속하기
          </a>
          <a
            href={buildOAuthHref("google")}
            onClick={onSocialClick}
            className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Google로 계속하기
          </a>
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" />
          또는 이메일
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              이메일
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              비밀번호
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-400"
              placeholder="비밀번호"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            로그인
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/forgot-password" className="underline hover:text-zinc-800">
            비밀번호를 잊으셨나요?
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-zinc-500">
          계정이 없으신가요?{" "}
          <Link
            href={
              nextParam
                ? `/register?next=${encodeURIComponent(nextParam)}`
                : "/register"
            }
            className="font-medium text-zinc-900 underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
