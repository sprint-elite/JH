"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { SiteSettingsData } from "@/lib/site-settings";

export function AdminSettingsForm() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings));
  }, []);

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSettings(data.settings);
      setMsg(
        "저장되었습니다. 주문·입금 안내 등은 DB 설정을 우선 사용합니다. 푸터 상수는 src/lib/site-info.ts와 맞춰 주세요.",
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
      </div>
    );
  }

  const fields: Array<keyof SiteSettingsData> = [
    "brandName",
    "companyName",
    "ceoName",
    "businessNumber",
    "mailOrderNumber",
    "address",
    "email",
    "phone",
    "hours",
    "bankAccount",
    "bankHolder",
  ];

  return (
    <div className="max-w-2xl space-y-4">
      {fields.map((key) => (
        <label key={key} className="block text-sm">
          <span className="text-xs font-medium text-slate-500">{key}</span>
          <input
            value={String(settings[key] ?? "")}
            onChange={(e) =>
              setSettings((s) => (s ? { ...s, [key]: e.target.value } : s))
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </label>
      ))}
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-500">기본 배송비</span>
        <input
          type="number"
          value={settings.shippingFee}
          onChange={(e) =>
            setSettings((s) =>
              s ? { ...s, shippingFee: Number(e.target.value) || 0 } : s,
            )
          }
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="text-xs font-medium text-slate-500">
          무료배송 기준 금액
        </span>
        <input
          type="number"
          value={settings.freeShippingThreshold}
          onChange={(e) =>
            setSettings((s) =>
              s
                ? {
                    ...s,
                    freeShippingThreshold: Number(e.target.value) || 0,
                  }
                : s,
            )
          }
          className="mt-1 w-full rounded-xl border px-3 py-2"
        />
      </label>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        저장
      </button>
    </div>
  );
}
