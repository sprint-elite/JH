import type { ReactNode } from "react";
import { Search } from "lucide-react";

export function AdminPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function AdminListCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function AdminListToolbar({
  countText,
  search,
  selects,
  pills,
}: {
  countText: ReactNode;
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  };
  selects?: ReactNode;
  pills?: ReactNode;
}) {
  return (
    <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm text-slate-500">{countText}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {search ? (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                placeholder={search.placeholder}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
              />
            </div>
          ) : null}
          {selects}
        </div>
      </div>
      {pills ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">{pills}</div>
      ) : null}
    </div>
  );
}

export function AdminFilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminFilterDivider() {
  return <span className="mx-1 hidden h-4 w-px self-center bg-slate-200 sm:inline-block" />;
}

export function AdminEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="text-slate-300">{icon}</div>
      <p className="mt-4 text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}

export function AdminSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-400"
    >
      {children}
    </select>
  );
}

export function AdminStatusBadge({
  active,
  activeLabel = "활성",
  inactiveLabel = "비활성",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function adminTableHeadClass() {
  return "border-b border-slate-100 text-xs font-medium text-slate-400";
}

export function adminTableRowClass() {
  return "group hover:bg-slate-50/80";
}

export function formatAdminDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
