"use client";

import { useMemo, useState } from "react";
import { Loader2, Percent, Plus, Search, Trash2, X } from "lucide-react";

type CouponRow = {
  id: string;
  code: string;
  name: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  perUserLimit: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  claimCount: number;
  createdAt: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
type TypeFilter = "ALL" | "FIXED" | "PERCENT";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function discountLabel(c: Pick<CouponRow, "discountType" | "discountValue">) {
  return c.discountType === "PERCENT"
    ? `${c.discountValue}%`
    : `${c.discountValue.toLocaleString()}원`;
}

export function AdminCouponManager({
  initialCoupons,
}: {
  initialCoupons: CouponRow[];
}) {
  const [rows, setRows] = useState(initialCoupons);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    discountType: "FIXED",
    discountValue: "3000",
    minOrderAmount: "0",
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (statusFilter === "ACTIVE") return r.isActive;
        if (statusFilter === "INACTIVE") return !r.isActive;
        return true;
      })
      .filter((r) =>
        typeFilter === "ALL" ? true : r.discountType === typeFilter,
      )
      .filter((r) => {
        if (!q) return true;
        return (
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [rows, query, statusFilter, typeFilter]);

  const detail = detailId ? rows.find((r) => r.id === detailId) ?? null : null;
  const activeCount = rows.filter((r) => r.isActive).length;

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount),
        }),
      });
      const data = (await res.json()) as {
        coupon?: Omit<CouponRow, "claimCount" | "createdAt"> & {
          createdAt?: string | Date;
        };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "생성 실패");
      if (data.coupon) {
        const createdAt =
          typeof data.coupon.createdAt === "string"
            ? data.coupon.createdAt
            : data.coupon.createdAt
              ? new Date(data.coupon.createdAt).toISOString()
              : new Date().toISOString();
        const row: CouponRow = {
          id: data.coupon.id,
          code: data.coupon.code,
          name: data.coupon.name,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
          minOrderAmount: data.coupon.minOrderAmount,
          maxDiscount: data.coupon.maxDiscount ?? null,
          usageLimit: data.coupon.usageLimit ?? null,
          perUserLimit: data.coupon.perUserLimit ?? 1,
          startsAt: data.coupon.startsAt ?? null,
          endsAt: data.coupon.endsAt ?? null,
          isActive: data.coupon.isActive,
          claimCount: 0,
          createdAt,
        };
        setRows((prev) => [row, ...prev]);
        setDetailId(row.id);
      }
      setOpen(false);
      setForm({
        code: "",
        name: "",
        discountType: "FIXED",
        discountValue: "3000",
        minOrderAmount: "0",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (c: CouponRow) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === c.id ? { ...r, isActive: !c.isActive } : r,
        ),
      );
    }
  };

  const remove = async (id: string) => {
    if (!confirm("삭제할까요?")) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (detailId === id) setDetailId(null);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            쿠폰
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            할인 쿠폰을 발급하고 활성/중지를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> 쿠폰 발급
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="전체" value={rows.length} />
        <StatCard label="활성" value={activeCount} accent="emerald" />
        <StatCard
          label="총 등록"
          value={rows.reduce((sum, c) => sum + c.claimCount, 0)}
          accent="indigo"
        />
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
                  placeholder="코드, 쿠폰명"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">유형 전체</option>
                <option value="FIXED">정액</option>
                <option value="PERCENT">비율</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL" as StatusFilter, label: "상태 전체" },
                { key: "ACTIVE" as StatusFilter, label: "활성" },
                { key: "INACTIVE" as StatusFilter, label: "중지" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusFilter === f.key
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
            <Percent className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {rows.length === 0
                ? "발급된 쿠폰이 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">코드</th>
                    <th className="px-3 py-3">쿠폰명</th>
                    <th className="px-3 py-3">할인</th>
                    <th className="px-3 py-3">최소주문</th>
                    <th className="px-3 py-3">등록</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">발급일</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setDetailId(c.id)}
                      className="group cursor-pointer hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {c.code}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 text-slate-700">
                        {c.name}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                          {c.discountType === "PERCENT" ? "비율" : "정액"}{" "}
                          {discountLabel(c)}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {c.minOrderAmount.toLocaleString()}원
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-700">
                        {c.claimCount}
                        {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={c.isActive} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                        {formatDate(c.createdAt)}
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => void toggle(c)}
                            className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                          >
                            {c.isActive ? "중지" : "활성"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(c.id)}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-slate-100 xl:hidden">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setDetailId(c.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {c.code}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      {c.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {discountLabel(c)} · 등록 {c.claimCount} ·{" "}
                      {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <StatusBadge active={c.isActive} />
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
                <h2 className="font-mono text-lg font-bold text-slate-900">
                  {detail.code}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{detail.name}</p>
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
              <dl className="space-y-2.5 text-sm">
                <DetailRow
                  label="할인"
                  value={`${detail.discountType === "PERCENT" ? "비율" : "정액"} ${discountLabel(detail)}`}
                />
                <DetailRow
                  label="최소주문"
                  value={`${detail.minOrderAmount.toLocaleString()}원`}
                />
                <DetailRow
                  label="최대할인"
                  value={
                    detail.maxDiscount != null
                      ? `${detail.maxDiscount.toLocaleString()}원`
                      : "제한 없음"
                  }
                />
                <DetailRow
                  label="등록"
                  value={`${detail.claimCount}${detail.usageLimit != null ? ` / ${detail.usageLimit}` : ""}`}
                />
                <DetailRow
                  label="인당"
                  value={`${detail.perUserLimit}회`}
                />
                <DetailRow label="시작" value={formatDate(detail.startsAt)} />
                <DetailRow label="종료" value={formatDate(detail.endsAt)} />
                <DetailRow
                  label="상태"
                  value={detail.isActive ? "활성" : "중지"}
                />
                <DetailRow
                  label="발급일"
                  value={formatDate(detail.createdAt)}
                />
              </dl>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => void toggle(detail)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                {detail.isActive ? "중지" : "활성"}
              </button>
              <button
                type="button"
                onClick={() => void remove(detail.id)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">쿠폰 발급</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                placeholder="코드 (WELCOME3000)"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                placeholder="쿠폰명"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountType: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              >
                <option value="FIXED">정액(원)</option>
                <option value="PERCENT">비율(%)</option>
              </select>
              <input
                placeholder="할인 값"
                value={form.discountValue}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discountValue: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                placeholder="최소 주문 금액"
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minOrderAmount: e.target.value }))
                }
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void create()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                발급
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? "활성" : "중지"}
    </span>
  );
}

function StatCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: number;
  accent?: "slate" | "emerald" | "indigo";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "indigo"
        ? "text-indigo-700"
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
      <dt className="w-20 shrink-0 text-xs font-medium text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 break-all text-slate-800">{value}</dd>
    </div>
  );
}
