"use client";

import { useMemo, useState } from "react";
import { Layers, Loader2, Search, X } from "lucide-react";

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  type: string;
  sortOrder: number;
  isActive: boolean;
  items: Array<{
    productId: string;
    product: { id: string; name: string; slug: string };
  }>;
};

type ProductOpt = { id: string; name: string; slug: string };
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export function AdminCollectionManager({
  initialCollections,
  products,
}: {
  initialCollections: CollectionRow[];
  products: ProductOpt[];
}) {
  const [rows, setRows] = useState(initialCollections);
  const [edit, setEdit] = useState<CollectionRow | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.type))).sort(),
    [rows],
  );

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (typeFilter === "ALL" ? true : r.type === typeFilter))
      .filter((r) => {
        if (statusFilter === "ACTIVE") return r.isActive;
        if (statusFilter === "INACTIVE") return !r.isActive;
        return true;
      })
      .filter((r) => {
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.items.some(
            (i) =>
              i.product.name.toLowerCase().includes(q) ||
              i.product.slug.toLowerCase().includes(q),
          )
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }, [rows, query, statusFilter, typeFilter]);

  const detail = detailId ? rows.find((r) => r.id === detailId) ?? null : null;

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }, [products, productQuery]);

  const openEdit = (c: CollectionRow) => {
    setEdit(c);
    setSelected(c.items.map((i) => i.productId));
    setProductQuery("");
  };

  const save = async () => {
    if (!edit) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/collections/${edit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: edit.name,
          sortOrder: edit.sortOrder,
          isActive: edit.isActive,
          productIds: selected,
        }),
      });
      const data = (await res.json()) as {
        collection?: CollectionRow;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      if (data.collection) {
        setRows((prev) =>
          prev.map((r) => (r.id === edit.id ? data.collection! : r)),
        );
        setDetailId(data.collection.id);
      }
      setEdit(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const toggleProduct = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          컬렉션
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          베스트·신상·트렌딩 등 홈 컬렉션 상품을 편집합니다.
        </p>
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
                  placeholder="이름, 슬러그, 포함 상품"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-300 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="ALL">유형 전체</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { key: "ALL" as StatusFilter, label: "상태 전체" },
                { key: "ACTIVE" as StatusFilter, label: "활성" },
                { key: "INACTIVE" as StatusFilter, label: "비활성" },
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
            <Layers className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              {rows.length === 0
                ? "등록된 컬렉션이 없습니다"
                : "검색 결과가 없습니다"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-medium text-slate-400">
                    <th className="px-4 py-3">컬렉션</th>
                    <th className="px-3 py-3">유형</th>
                    <th className="px-3 py-3">상품 수</th>
                    <th className="px-3 py-3">정렬</th>
                    <th className="px-3 py-3">상태</th>
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
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {c.slug}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {c.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-700">
                        {c.items.length}개
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600">
                        {c.sortOrder}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge active={c.isActive} />
                      </td>
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          편집
                        </button>
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
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50/80"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {c.type} · {c.items.length}개 · 정렬 {c.sortOrder}
                    </p>
                    <p className="font-mono text-[11px] text-slate-400">
                      {c.slug}
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
                <h2 className="text-lg font-bold text-slate-900">
                  {detail.name}
                </h2>
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  {detail.slug}
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
              <dl className="space-y-2.5 text-sm">
                <DetailRow label="유형" value={detail.type} />
                <DetailRow label="정렬" value={String(detail.sortOrder)} />
                <DetailRow
                  label="상태"
                  value={detail.isActive ? "활성" : "비활성"}
                />
                <DetailRow
                  label="상품 수"
                  value={`${detail.items.length}개`}
                />
              </dl>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">
                포함 상품
              </h3>
              {detail.items.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  포함된 상품이 없습니다.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {detail.items.map((item) => (
                    <li
                      key={item.productId}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        {item.product.name}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {item.product.slug}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setDetailId(null);
                  openEdit(detail);
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                편집
              </button>
            </div>
          </div>
        </div>
      )}

      {edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{edit.name} 편집</h3>
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-4 block text-sm">
              <span className="text-xs text-slate-500">이름</span>
              <input
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>
            <label className="mt-3 block text-sm">
              <span className="text-xs text-slate-500">정렬</span>
              <input
                type="number"
                value={edit.sortOrder}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    sortOrder: Number(e.target.value) || 0,
                  })
                }
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={edit.isActive}
                onChange={(e) =>
                  setEdit({ ...edit, isActive: e.target.checked })
                }
              />
              활성
            </label>
            <p className="mt-4 text-xs font-semibold text-slate-500">
              포함 상품
            </p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="상품 검색"
                className="w-full rounded-xl border py-2 pl-8 pr-3 text-sm"
              />
            </div>
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
              {filteredProducts.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                    />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.slug}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              선택 {selected.length}개
              {selected
                .map((id) => productMap.get(id)?.name)
                .filter(Boolean)
                .slice(0, 3)
                .join(", ")
                ? ` · ${selected
                    .map((id) => productMap.get(id)?.name)
                    .filter(Boolean)
                    .slice(0, 3)
                    .join(", ")}`
                : ""}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEdit(null)}
                className="rounded-xl border px-4 py-2 text-sm"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                저장
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
      {active ? "활성" : "비활성"}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-xs font-medium text-slate-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-slate-800">{value}</dd>
    </div>
  );
}
