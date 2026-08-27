"use client";

import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Tags, Trash2 } from "lucide-react";
import type { AdminCategoryDto } from "@/lib/admin-catalog";
import { slugify } from "@/lib/builder-types";
import {
  AdminEmptyState,
  AdminFilterPill,
  AdminListCard,
  AdminListToolbar,
  AdminPageShell,
  AdminStatusBadge,
  adminTableHeadClass,
  adminTableRowClass,
} from "@/components/admin/AdminListUi";

interface AdminCategoryManagerProps {
  initialCategories: AdminCategoryDto[];
}

type FormState = {
  name: string;
  slug: string;
  sortOrder: string;
  isActive: boolean;
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  sortOrder: "0",
  isActive: true,
});

export function AdminCategoryManager({
  initialCategories,
}: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const title = editingId ? "카테고리 수정" : "카테고리 추가";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...categories]
      .filter((c) => {
        if (statusFilter === "ACTIVE") return c.isActive;
        if (statusFilter === "INACTIVE") return !c.isActive;
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [categories, query, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  };

  const openEdit = (c: AdminCategoryDto) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      sortOrder: String(c.sortOrder),
      isActive: c.isActive,
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      const res = await fetch(
        editingId
          ? `/api/admin/categories/${editingId}`
          : "/api/admin/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as {
        categories?: AdminCategoryDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setCategories(data.categories ?? []);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: AdminCategoryDto) => {
    if (!confirm(`"${c.name}" 카테고리를 삭제할까요?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        categories?: AdminCategoryDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminPageShell
      title="카테고리"
      description="스토어 목록 필터에 사용되는 카테고리를 관리합니다."
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          카테고리 추가
        </button>
      }
    >
      {error && !open ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시{" "}
              <span className="font-semibold text-slate-800">
                {filtered.length}
              </span>{" "}
              / {categories.length}건
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "이름, 슬러그 검색",
          }}
          pills={
            <>
              {(
                [
                  ["ALL", "상태 전체"],
                  ["ACTIVE", "활성"],
                  ["INACTIVE", "비활성"],
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={key}
                  active={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
            </>
          }
        />

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<Tags className="h-12 w-12" />}
            title={
              categories.length === 0
                ? "등록된 카테고리가 없습니다"
                : "검색 결과가 없습니다"
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className={adminTableHeadClass()}>
                    <th className="px-4 py-3">이름</th>
                    <th className="px-3 py-3">슬러그</th>
                    <th className="px-3 py-3">정렬</th>
                    <th className="px-3 py-3">상품수</th>
                    <th className="px-3 py-3">상태</th>
                    <th className="px-3 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className={adminTableRowClass()}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {c.name}
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-slate-500">
                        {c.slug}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {c.sortOrder}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {c.productCount}
                      </td>
                      <td className="px-3 py-3">
                        <AdminStatusBadge active={c.isActive} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                            title="수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void remove(c)}
                            className="inline-flex items-center justify-center border border-slate-200 p-1.5 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            title="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 xl:hidden">
              {filtered.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {c.slug}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        정렬 {c.sortOrder} · 상품 {c.productCount}
                      </p>
                    </div>
                    <AdminStatusBadge active={c.isActive} />
                  </div>
                  <div className="mt-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      수정
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(c)}
                      className="inline-flex items-center gap-1 border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminListCard>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <div className="mt-4 space-y-3">
              <Field
                label="이름"
                value={form.name}
                onChange={(name) =>
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }))
                }
              />
              <Field
                label="슬러그"
                value={form.slug}
                onChange={(slug) => setForm((f) => ({ ...f, slug }))}
                mono
              />
              <Field
                label="정렬 순서"
                value={form.sortOrder}
                onChange={(sortOrder) => setForm((f) => ({ ...f, sortOrder }))}
              />
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                />
                활성
              </label>
            </div>
            {error && (
              <p className="mt-3 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

function Field({
  label,
  value,
  onChange,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-slate-400 ${
          mono ? "font-mono text-xs" : ""
        }`}
      />
    </label>
  );
}
