"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { AddressDto } from "@/lib/addresses";
import { useDaumPostcode } from "@/hooks/useDaumPostcode";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400";

type FormState = {
  label: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string;
  isDefault: boolean;
};

function emptyForm(): FormState {
  return {
    label: "기본",
    recipientName: "",
    phone: "",
    zipCode: "",
    address1: "",
    address2: "",
    isDefault: false,
  };
}

interface MyAddressManagerProps {
  initialAddresses: AddressDto[];
}

export function MyAddressManager({ initialAddresses }: MyAddressManagerProps) {
  const { openPostcode } = useDaumPostcode();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setOpen(true);
  };

  const openEdit = (a: AddressDto) => {
    setEditingId(a.id);
    setForm({
      label: a.label,
      recipientName: a.recipientName,
      phone: a.phone,
      zipCode: a.zipCode,
      address1: a.address1,
      address2: a.address2 ?? "",
      isDefault: a.isDefault,
    });
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        editingId ? `/api/me/addresses/${editingId}` : "/api/me/addresses",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = (await res.json()) as {
        address?: AddressDto;
        error?: string;
      };
      if (!res.ok || !data.address) throw new Error(data.error ?? "저장 실패");

      setAddresses((prev) => {
        const next = editingId
          ? prev.map((a) => (a.id === editingId ? data.address! : a))
          : [...prev, data.address!];
        if (data.address!.isDefault) {
          return next.map((a) => ({
            ...a,
            isDefault: a.id === data.address!.id,
          }));
        }
        return next;
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a: AddressDto) => {
    if (!confirm(`"${a.label}" 배송지를 삭제할까요?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/me/addresses/${a.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      setAddresses((prev) => prev.filter((x) => x.id !== a.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          등록된 배송지 {addresses.length}곳
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" />
          배송지 추가
        </button>
      </div>

      {error && !open && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
          <p className="text-sm text-zinc-500">등록된 배송지가 없습니다.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-zinc-200 bg-white px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">{a.label}</p>
                    {a.isDefault && (
                      <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                        기본
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-800">
                    {a.recipientName} · {a.phone}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    ({a.zipCode}) {a.address1}
                    {a.address2 ? ` ${a.address2}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void remove(a)}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              {editingId ? "배송지 수정" : "배송지 추가"}
            </h3>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["label", "배송지명", "집, 회사"],
                  ["recipientName", "받는 분", "홍길동"],
                  ["phone", "연락처", "010-0000-0000"],
                ] as const
              ).map(([key, label, placeholder]) => (
                <label key={key} className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                    {label}
                  </span>
                  <input
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  우편번호
                </span>
                <div className="flex gap-2">
                  <input
                    value={form.zipCode}
                    readOnly
                    placeholder="검색으로 입력"
                    className={`${inputClass} bg-zinc-50`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void openPostcode().then((r) => {
                        if (!r) return;
                        setForm((f) => ({
                          ...f,
                          zipCode: r.zipCode,
                          address1: r.address,
                        }));
                      });
                    }}
                    className="shrink-0 rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-800"
                  >
                    검색
                  </button>
                </div>
              </div>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  주소
                </span>
                <input
                  value={form.address1}
                  placeholder="도로명 주소"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address1: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                  상세 주소
                </span>
                <input
                  value={form.address2}
                  placeholder="동·호수"
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address2: e.target.value }))
                  }
                  className={inputClass}
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, isDefault: e.target.checked }))
                  }
                />
                기본 배송지로 설정
              </label>
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
