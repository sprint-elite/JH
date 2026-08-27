"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-500 outline-none focus:border-zinc-400";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보 처리방침에 동의해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          agreeTerms,
          agreePrivacy,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        verifyUrl?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "회원가입에 실패했습니다.");
      }

      if (data.verifyUrl) {
        setVerifyUrl(data.verifyUrl);
        router.refresh();
        return;
      }

      router.push(nextParam ?? "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  const continueAfterRegister = () => {
    router.push(nextParam ?? "/");
    router.refresh();
  };

  const loginHref = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}`
    : "/login";

  const buildOAuthHref = (provider: "kakao" | "google") => {
    const params = new URLSearchParams();
    if (nextParam) params.set("next", nextParam);
    params.set("agreeTerms", "1");
    params.set("agreePrivacy", "1");
    return `/api/auth/${provider}?${params.toString()}`;
  };

  const onSocialClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!agreeTerms || !agreePrivacy) {
      e.preventDefault();
      setError("이용약관과 개인정보 처리방침에 동의해 주세요.");
    }
  };

  if (verifyUrl) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900">가입 완료</h1>
          <p className="mt-2 text-sm text-zinc-500">
            이메일 인증 링크가 발급되었습니다. 실제 메일 연동 전까지는 아래
            링크로 인증할 수 있습니다.
          </p>
          <a
            href={verifyUrl}
            className="mt-4 block break-all rounded-xl bg-zinc-50 px-3 py-3 text-sm font-medium text-zinc-900 underline"
          >
            {verifyUrl}
          </a>
          <div className="mt-6 flex flex-col gap-2">
            <a
              href={verifyUrl}
              className="flex w-full items-center justify-center rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              이메일 인증하기
            </a>
            <button
              type="button"
              onClick={continueAfterRegister}
              className="flex w-full items-center justify-center rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              나중에 하고 계속하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">회원가입</h1>
        <p className="mt-2 text-sm text-zinc-500">
          가입 후 디자인 저장·주문 내역 확인이 가능합니다.
        </p>

        <div className="mt-6 space-y-2 rounded-xl bg-zinc-50 p-3 text-sm">
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
              에 동의합니다 (필수)
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
              에 동의합니다 (필수)
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
            카카오로 가입
          </a>
          <a
            href={buildOAuthHref("google")}
            onClick={onSocialClick}
            className="flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Google로 가입
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
              이름
            </label>
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="홍길동"
            />
          </div>
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
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              연락처 <span className="font-normal text-zinc-400">(선택)</span>
            </label>
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              비밀번호
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="8자 이상"
              minLength={8}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">
              비밀번호 확인
            </label>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={inputClass}
              placeholder="비밀번호 재입력"
              minLength={8}
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
            가입하기
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          이미 계정이 있으신가요?{" "}
          <Link href={loginHref} className="font-medium text-zinc-900 underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
