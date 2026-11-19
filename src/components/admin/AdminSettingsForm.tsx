"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import {
  AdminListCard,
  AdminPageShell,
} from "@/components/admin/AdminListUi";
import type { SiteSettingsData } from "@/lib/site-settings";

const FIELD_LABELS: Record<
  Exclude<keyof SiteSettingsData, "shippingFee" | "freeShippingThreshold">,
  string
> = {
  brandName: "브랜드명",
  companyName: "상호(회사명)",
  ceoName: "대표자명",
  businessNumber: "사업자등록번호",
  mailOrderNumber: "통신판매업신고번호",
  address: "사업장 주소",
  email: "고객센터 이메일",
  phone: "고객센터 전화",
  hours: "운영시간",
  bankAccount: "무통장 계좌",
  bankHolder: "예금주",
};

const BRAND_FIELDS = [
  "brandName",
  "companyName",
  "ceoName",
  "businessNumber",
  "mailOrderNumber",
  "address",
] as const;

const CONTACT_FIELDS = ["email", "phone", "hours"] as const;

const BANK_FIELDS = ["bankAccount", "bankHolder"] as const;

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-100 px-5 py-6 last:border-b-0 sm:px-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function AdminSettingsForm() {
  const [settings, setSettings] = useState<SiteSettingsData | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings))
      .catch(() => setError("설정을 불러오지 못했습니다."));
  }, []);

  const setField = <K extends keyof SiteSettingsData>(
    key: K,
    value: SiteSettingsData[K],
  ) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      setSettings(data.settings);
      setMsg("저장되었습니다. 푸터·헤더·입금 안내·메일 제목에 바로 반영됩니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <AdminPageShell
        title="사이트 설정"
        description="사업자·CS·계좌·배송비 정보를 관리합니다."
      >
        <AdminListCard>
          <div className="flex items-center gap-2 px-5 py-16 text-sm text-slate-500 sm:px-6">
            {error ? (
              <span className="text-rose-600">{error}</span>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
              </>
            )}
          </div>
        </AdminListCard>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title="사이트 설정"
      description="사업자·CS·계좌·배송비 정보를 관리합니다. 저장 즉시 스토어프론트에 반영됩니다."
      actions={
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          저장
        </button>
      }
    >
      <AdminListCard>
        <Section
          title="브랜드 · 사업자"
          description="푸터·약관·메일 제목에 쓰입니다."
        >
          {BRAND_FIELDS.map((key) => (
            <Field
              key={key}
              label={FIELD_LABELS[key]}
              className={key === "address" ? "sm:col-span-2" : undefined}
            >
              <input
                value={String(settings[key] ?? "")}
                onChange={(e) => setField(key, e.target.value)}
                className={inputClass}
              />
            </Field>
          ))}
        </Section>

        <Section title="고객센터" description="문의·교환반품 안내에 표시됩니다.">
          {CONTACT_FIELDS.map((key) => (
            <Field key={key} label={FIELD_LABELS[key]}>
              <input
                value={String(settings[key] ?? "")}
                onChange={(e) => setField(key, e.target.value)}
                className={inputClass}
              />
            </Field>
          ))}
        </Section>

        <Section title="무통장 입금" description="주문·결제 화면에 안내됩니다.">
          {BANK_FIELDS.map((key) => (
            <Field key={key} label={FIELD_LABELS[key]}>
              <input
                value={String(settings[key] ?? "")}
                onChange={(e) => setField(key, e.target.value)}
                className={inputClass}
              />
            </Field>
          ))}
        </Section>

        <Section title="배송비" description="주문 합계 기준입니다.">
          <Field label="기본 배송비 (원)">
            <input
              type="number"
              min={0}
              value={settings.shippingFee}
              onChange={(e) =>
                setField("shippingFee", Number(e.target.value) || 0)
              }
              className={inputClass}
            />
          </Field>
          <Field label="무료배송 기준 금액 (원)">
            <input
              type="number"
              min={0}
              value={settings.freeShippingThreshold}
              onChange={(e) =>
                setField(
                  "freeShippingThreshold",
                  Number(e.target.value) || 0,
                )
              }
              className={inputClass}
            />
          </Field>
        </Section>

        {(msg || error) && (
          <div className="border-t border-slate-100 px-5 py-4 sm:px-6">
            {msg ? (
              <p className="text-sm text-emerald-700">{msg}</p>
            ) : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          </div>
        )}
      </AdminListCard>
    </AdminPageShell>
  );
}
