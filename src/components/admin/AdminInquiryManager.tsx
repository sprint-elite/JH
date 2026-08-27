"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Loader2, MessageSquare } from "lucide-react";
import {
  AdminEmptyState,
  AdminFilterPill,
  AdminListCard,
  AdminListToolbar,
  AdminPageShell,
  adminTableHeadClass,
  adminTableRowClass,
  formatAdminDate,
} from "@/components/admin/AdminListUi";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: "미답변",
  ANSWERED: "답변완료",
  CLOSED: "종료",
};

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  const cls =
    status === "OPEN"
      ? "bg-amber-50 text-amber-700"
      : status === "ANSWERED"
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

export function AdminInquiryManager() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/inquiries");
    const data = (await res.json()) as { inquiries?: Inquiry[] };
    setRows(data.inquiries ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () => ({
      open: rows.filter((r) => r.status === "OPEN").length,
      answered: rows.filter((r) => r.status === "ANSWERED").length,
      closed: rows.filter((r) => r.status === "CLOSED").length,
    }),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (status === "ALL" ? true : r.status === status))
      .filter(
        (r) =>
          !q ||
          r.subject.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.body.toLowerCase().includes(q),
      );
  }, [rows, query, status]);

  const saveReply = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminReply: reply, status: "ANSWERED" }),
      });
      if (!res.ok) throw new Error("저장 실패");
      await load();
      setSelected(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const openDetail = (r: Inquiry) => {
    setSelected(r);
    setReply(r.adminReply ?? "");
  };

  return (
    <AdminPageShell
      title="1:1 문의"
      description="고객 문의를 확인하고 답변을 등록합니다."
    >
      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시 <span className="font-semibold text-slate-800">{filtered.length}</span> /{" "}
              {rows.length}건
              {counts.open > 0 ? (
                <span className="ml-2 text-amber-600">· 미답변 {counts.open}</span>
              ) : null}
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "제목, 이름, 이메일, 내용",
          }}
          pills={
            <>
              {(
                [
                  ["ALL", "상태 전체"],
                  ["OPEN", `미답변 ${counts.open}`],
                  ["ANSWERED", `답변완료 ${counts.answered}`],
                  ["CLOSED", `종료 ${counts.closed}`],
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={key}
                  active={status === key}
                  onClick={() => setStatus(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
            </>
          }
        />

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title={rows.length === 0 ? "등록된 문의가 없습니다" : "검색 결과가 없습니다"}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className={adminTableHeadClass()}>
                    <th className="px-4 py-3">문의</th>
                    <th className="px-3 py-3">고객</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3">접수일</th>
                    <th className="px-3 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className={`${adminTableRowClass()} cursor-pointer`}
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{r.subject}</p>
                        <p className="mt-0.5 line-clamp-1 max-w-md text-xs text-slate-500">
                          {r.body}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-800">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {formatAdminDate(r.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          상세
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 xl:hidden">
              {filtered.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openDetail(r)}
                    className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <div className="mb-1">
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="font-medium text-slate-900">{r.subject}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.name} · {r.email}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatAdminDate(r.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminListCard>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-6">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">{selected.subject}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {selected.name} · {selected.email} · {formatAdminDate(selected.createdAt)}
            </p>
            <div className="mt-2">
              <StatusBadge status={selected.status} />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {selected.body}
            </p>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-slate-500">답변</span>
              <textarea
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="고객에게 전달할 답변을 입력하세요"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border px-4 py-2.5 text-sm font-medium"
              >
                닫기
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveReply()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                답변 저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
