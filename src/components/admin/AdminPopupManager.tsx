"use client";

import { useMemo, useState } from "react";
import { Loader2, Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  AdminEmptyState,
  AdminListCard,
  AdminListToolbar,
  AdminPageShell,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/admin/AdminListUi";

export type PopupRow = {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  dismissHours: number;
  sortOrder: number;
};

type FormState = Omit<PopupRow, "id">;

const empty = (): FormState => ({
  title: "",
  body: "",
  imageUrl: "",
  linkUrl: "",
  linkLabel: "자세히 보기",
  isActive: true,
  startsAt: null,
  endsAt: null,
  dismissHours: 24,
  sortOrder: 0,
});

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatRange(row: PopupRow) {
  if (!row.startsAt && !row.endsAt) return "상시";
  const a = row.startsAt
    ? new Date(row.startsAt).toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "시작 없음";
  const b = row.endsAt
    ? new Date(row.endsAt).toLocaleString("ko-KR", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "종료 없음";
  return `${a} ~ ${b}`;
}

export function AdminPopupManager({ initialPopups }: { initialPopups: PopupRow[] }) {
  const [rows, setRows] = useState(initialPopups);
  const [form, setForm] = useState<FormState>(empty());
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          (r.body?.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  }, [rows, query]);

  const openCreate = () => {
    const nextOrder = rows.reduce((max, r) => Math.max(max, r.sortOrder), -1) + 1;
    setEditId(null);
    setForm({ ...empty(), sortOrder: nextOrder });
    setError(null);
    setOpen(true);
  };

  const openEdit = (row: PopupRow) => {
    setEditId(row.id);
    setForm({
      title: row.title,
      body: row.body ?? "",
      imageUrl: row.imageUrl ?? "",
      linkUrl: row.linkUrl ?? "",
      linkLabel: row.linkLabel ?? "자세히 보기",
      isActive: row.isActive,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      dismissHours: row.dismissHours,
      sortOrder: row.sortOrder,
    });
    setError(null);
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "업로드 실패");
      setForm((f) => ({ ...f, imageUrl: data.url! }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        body: form.body || null,
        imageUrl: form.imageUrl || null,
        linkUrl: form.linkUrl || null,
        linkLabel: form.linkLabel || null,
        isActive: form.isActive,
        startsAt: form.startsAt,
        endsAt: form.endsAt,
        dismissHours: form.dismissHours,
        sortOrder: form.sortOrder,
      };
      const res = await fetch(
        editId ? `/api/admin/popups/${editId}` : "/api/admin/popups",
        {
          method: editId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { popup?: PopupRow; error?: string };
      if (!res.ok || !data.popup) throw new Error(data.error ?? "저장 실패");
      setRows((prev) =>
        editId
          ? prev.map((r) => (r.id === editId ? data.popup! : r))
          : [data.popup!, ...prev],
      );
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: PopupRow) => {
    if (!confirm(`"${row.title}" 팝업을 삭제할까요?`)) return;
    const res = await fetch(`/api/admin/popups/${row.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const toggleActive = async (row: PopupRow) => {
    const res = await fetch(`/api/admin/popups/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    const data = (await res.json()) as { popup?: PopupRow };
    if (res.ok && data.popup) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? data.popup! : r)));
    }
  };

  return (
    <AdminPageShell
      title="메인 팝업"
      description="활성 팝업 중 정렬 순서가 가장 낮은 1개만 메인 홈에 표시됩니다."
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" /> 팝업 추가
        </button>
      }
    >
      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시{" "}
              <span className="font-semibold text-slate-900">{filtered.length}</span> /{" "}
              {rows.length}건
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "제목, 내용",
          }}
        />

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<Megaphone className="h-12 w-12" />}
            title={rows.length === 0 ? "등록된 팝업이 없습니다" : "검색 결과가 없습니다"}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className={adminTableHeadClass()}>
                  <th className="px-4 py-3">팝업</th>
                  <th className="px-3 py-3">기간</th>
                  <th className="px-3 py-3">정렬</th>
                  <th className="px-3 py-3">상태</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((row) => (
                  <tr key={row.id} className={adminTableRowClass()}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{row.title}</p>
                      {row.body ? (
                        <p className="mt-0.5 max-w-sm truncate text-xs text-slate-500">
                          {row.body}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {formatRange(row)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {row.sortOrder}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(row)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {row.isActive ? "활성" : "비활성"}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(row)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminListCard>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editId ? "팝업 수정" : "팝업 추가"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">제목</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">내용</span>
                <textarea
                  rows={4}
                  value={form.body ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">이미지</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadImage(file);
                    e.target.value = "";
                  }}
                />
                {uploading ? (
                  <p className="mt-1 text-xs text-slate-500">올리는 중…</p>
                ) : null}
                {form.imageUrl ? (
                  <p className="mt-1 truncate text-xs text-slate-500">{form.imageUrl}</p>
                ) : null}
              </div>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">링크</span>
                <input
                  value={form.linkUrl ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="/products/list"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">버튼 문구</span>
                <input
                  value={form.linkLabel ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, linkLabel: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">시작</span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.startsAt)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startsAt: fromLocalInput(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">종료</span>
                  <input
                    type="datetime-local"
                    value={toLocalInput(form.endsAt)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endsAt: fromLocalInput(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">
                    다시 보지 않기 (시간)
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={720}
                    value={form.dismissHours}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dismissHours: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    24면 하루, 0이면 닫으면 새로고침 때 다시 뜸
                  </span>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">정렬</span>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sortOrder: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                메인에 표시
              </label>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
