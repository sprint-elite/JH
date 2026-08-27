"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Star, X } from "lucide-react";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  content: string;
  isVisible: boolean;
  isHot: boolean;
  createdAt: string;
  userName: string;
  userEmail: string;
  productName: string;
  productSlug: string;
};

type VisibleFilter = "ALL" | "VISIBLE" | "HIDDEN";
type HotFilter = "ALL" | "HOT" | "NORMAL";
type RatingFilter = "ALL" | "5" | "4" | "3" | "2" | "1";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminReviewManager({
  initialReviews,
}: {
  initialReviews: ReviewRow[];
}) {
  const [rows, setRows] = useState(initialReviews);
  const [query, setQuery] = useState("");
  const [visibleFilter, setVisibleFilter] = useState<VisibleFilter>("ALL");
  const [hotFilter, setHotFilter] = useState<HotFilter>("ALL");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (visibleFilter === "VISIBLE") return r.isVisible;
        if (visibleFilter === "HIDDEN") return !r.isVisible;
        return true;
      })
      .filter((r) => {
        if (hotFilter === "HOT") return r.isHot;
        if (hotFilter === "NORMAL") return !r.isHot;
        return true;
      })
      .filter((r) =>
        ratingFilter === "ALL" ? true : r.rating === Number(ratingFilter),
      )
      .filter((r) => {
        if (!q) return true;
        return (
          r.productName.toLowerCase().includes(q) ||
          r.productSlug.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.userEmail.toLowerCase().includes(q) ||
          (r.title?.toLowerCase().includes(q) ?? false) ||
          r.content.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [rows, query, visibleFilter, hotFilter, ratingFilter]);

  const detail = detailId ? rows.find((r) => r.id === detailId) ?? null : null;

  const visibleCount = rows.filter((r) => r.isVisible).length;
  const hotCount = rows.filter((r) => r.isHot).length;
  const hiddenCount = rows.length - visibleCount;

  const patch = async (
    id: string,
    data: { isVisible?: boolean; isHot?: boolean },
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) return;
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r)),
      );
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("리뷰를 삭제할까요?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        if (detailId === id) setDetailId(null);
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          리뷰 검수
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          노출·HOT 지정과 삭제 처리를 한곳에서 관리합니다.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="전체" value={rows.length} />
        <StatCard label="노출" value={visibleCount} accent="emerald" />
        <StatCard label="숨김" value={hiddenCount} accent="slate" />
        <StatCard label="HOT" value={hotCount} accent="amber" />
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-slate-500">
              표시{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>
              / {rows.length}건
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="상품, 작성자, 내용"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={ratingFilter}
                onChange={(e) =>
                  setRatingFilter(e.target.value as RatingFilter)
                }
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">별점 전체</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={String(n)}>
                    ★ {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL" as VisibleFilter, label: "노출 전체" },
                { key: "VISIBLE" as VisibleFilter, label: "노출" },
                { key: "HIDDEN" as VisibleFilter, label: "숨김" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setVisibleFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  visibleFilter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="mx-1 w-px self-stretch bg-slate-200" />
            {(
              [
                { key: "ALL" as HotFilter, label: "HOT 전체" },
                { key: "HOT" as HotFilter, label: "HOT" },
                { key: "NORMAL" as HotFilter, label: "일반" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setHotFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  hotFilter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <Star className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {rows.length === 0
                ? "등록된 리뷰가 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">상품</th>
                    <th className="px-3 py-3">별점</th>
                    <th className="px-3 py-3">작성자</th>
                    <th className="px-3 py-3">내용</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">작성일</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => {
                    const busy = busyId === r.id;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setDetailId(r.id)}
                        className="group cursor-pointer hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3">
                          <p className="max-w-[180px] truncate font-medium text-slate-900">
                            {r.productName}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {r.productSlug}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {r.rating}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-slate-800">
                            {r.userName}
                          </p>
                          <p className="max-w-[140px] truncate text-xs text-slate-500">
                            {r.userEmail}
                          </p>
                        </td>
                        <td className="max-w-[280px] px-3 py-3">
                          {r.title ? (
                            <p className="truncate text-xs font-medium text-slate-700">
                              {r.title}
                            </p>
                          ) : null}
                          <p className="truncate text-sm text-slate-600">
                            {r.content}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                r.isVisible
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {r.isVisible ? "노출" : "숨김"}
                            </span>
                            {r.isHot ? (
                              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                HOT
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                          {formatDate(r.createdAt)}
                        </td>
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void patch(r.id, { isVisible: !r.isVisible })
                              }
                              className="rounded-lg border px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
                            >
                              {r.isVisible ? "숨김" : "노출"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void patch(r.id, { isHot: !r.isHot })
                              }
                              className="rounded-lg border px-2 py-1 text-[11px] font-semibold disabled:opacity-50"
                            >
                              {r.isHot ? "HOT↓" : "HOT"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDetailId(r.id)}
                  className="w-full space-y-2 px-4 py-4 text-left hover:bg-slate-50/80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {r.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.userName} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-sm font-semibold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {r.rating}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm text-slate-600">
                    {r.content}
                  </p>
                  <div className="flex gap-1">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                        r.isVisible
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.isVisible ? "노출" : "숨김"}
                    </span>
                    {r.isHot ? (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        HOT
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">리뷰 상세</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  {detail.productName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-base font-bold text-amber-600">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {detail.rating}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    detail.isVisible
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {detail.isVisible ? "노출" : "숨김"}
                </span>
                {detail.isHot ? (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    HOT
                  </span>
                ) : null}
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <DetailRow label="작성자" value={detail.userName} />
                <DetailRow label="이메일" value={detail.userEmail} />
                <DetailRow label="작성일" value={formatDate(detail.createdAt)} />
                <DetailRow
                  label="상품"
                  value={detail.productName}
                />
              </dl>
              {detail.title ? (
                <p className="mt-4 text-sm font-semibold text-slate-900">
                  {detail.title}
                </p>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {detail.content}
              </p>
              <Link
                href={`/products/${detail.productSlug}`}
                target="_blank"
                className="mt-4 inline-flex text-xs font-semibold text-indigo-600 hover:underline"
              >
                스토어 상품 보기 →
              </Link>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                disabled={busyId === detail.id}
                onClick={() =>
                  void patch(detail.id, { isVisible: !detail.isVisible })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {detail.isVisible ? "숨김" : "노출"}
              </button>
              <button
                type="button"
                disabled={busyId === detail.id}
                onClick={() => void patch(detail.id, { isHot: !detail.isHot })}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                {detail.isHot ? "HOT 해제" : "HOT"}
              </button>
              <button
                type="button"
                disabled={busyId === detail.id}
                onClick={() => void remove(detail.id)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "emerald" | "amber";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "amber"
        ? "text-amber-700"
        : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 shrink-0 text-xs font-medium text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-all text-slate-800">{value}</dd>
    </div>
  );
}
