"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type InquiryRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export function InquiryForm() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<InquiryRow[]>([]);

  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || user.name);
    setEmail((prev) => prev || user.email);
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) setRows([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/inquiries");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { inquiries?: InquiryRow[] };
        if (!cancelled) setRows(data.inquiries ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const reloadMine = async () => {
    if (!user) return;
    const res = await fetch("/api/inquiries");
    if (!res.ok) return;
    const data = (await res.json()) as { inquiries?: InquiryRow[] };
    setRows(data.inquiries ?? []);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, body }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "접수 실패");
      setDone(true);
      setSubject("");
      setBody("");
      await reloadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : "접수 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-10 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">1:1 문의</h1>
        <p className="mt-2 text-sm text-zinc-500">
          주문·배송·상품 관련 문의를 남겨 주세요.{" "}
          <Link href="/faq" className="underline">
            FAQ
          </Link>
          도 함께 확인해 보세요.
        </p>
      </div>

      {done && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          문의가 접수되었습니다. 답변이 달리면 이 페이지의 내 문의 내역에서
          확인할 수 있습니다.
        </p>
      )}

      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="제목"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        <textarea
          required
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="문의 내용 (5자 이상)"
          className="w-full rounded-xl border px-3 py-2.5 text-sm"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          문의 접수
        </button>
      </form>

      {user ? (
        <section>
          <h2 className="text-sm font-bold text-zinc-900">내 문의 내역</h2>
          <ul className="mt-3 divide-y rounded-2xl border border-zinc-200 bg-white">
            {rows.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                문의 내역이 없습니다.
              </li>
            ) : (
              rows.map((r) => (
                <li key={r.id} className="space-y-2 px-4 py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-zinc-900">{r.subject}</p>
                    <span className="shrink-0 text-[11px] font-semibold text-zinc-500">
                      {r.adminReply ? "답변완료" : "접수"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-zinc-600">{r.body}</p>
                  {r.adminReply ? (
                    <div className="rounded-xl bg-zinc-50 px-3 py-2.5 text-zinc-800">
                      <p className="text-[11px] font-semibold text-zinc-500">
                        관리자 답변
                        {r.repliedAt
                          ? ` · ${new Date(r.repliedAt).toLocaleDateString("ko-KR")}`
                          : ""}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap">{r.adminReply}</p>
                    </div>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </section>
      ) : (
        <p className="text-center text-xs text-zinc-500">
          <Link href="/login?next=/inquiry" className="underline">
            로그인
          </Link>
          하면 문의·답변 내역을 확인할 수 있습니다.
        </p>
      )}
    </div>
  );
}
