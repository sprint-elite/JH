"use client";

import { useMemo, useState } from "react";
import { Loader2, Trash2, Users } from "lucide-react";
import type { AdminUserDto } from "@/lib/admin-users";
import type { UserRole } from "@/types";
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

type RoleFilter = "ALL" | UserRole;

interface AdminUserManagerProps {
  initialUsers: AdminUserDto[];
  currentUserId: string;
}

export function AdminUserManager({
  initialUsers,
  currentUserId,
}: AdminUserManagerProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone?.includes(q) ?? false)
      );
    });
  }, [users, query, roleFilter]);

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "ADMIN").length,
      customer: users.filter((u) => u.role === "CUSTOMER").length,
    }),
    [users],
  );

  const changeRole = async (user: AdminUserDto, role: UserRole) => {
    if (user.role === role) return;
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as {
        users?: AdminUserDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "권한 변경 실패");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "권한 변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (user: AdminUserDto) => {
    if (
      !confirm(
        `"${user.name}" (${user.email}) 계정을 삭제할까요?\n주문 이력이 있으면 삭제할 수 없습니다.`,
      )
    ) {
      return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as {
        users?: AdminUserDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "삭제 실패");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminPageShell
      title="계정 관리"
      description="가입한 회원·관리자 계정을 조회하고 권한을 변경합니다."
    >
      <AdminListCard>
        <AdminListToolbar
          countText={
            <>
              표시{" "}
              <span className="font-semibold text-slate-800">
                {filtered.length}
              </span>{" "}
              / {users.length}건
            </>
          }
          search={{
            value: query,
            onChange: setQuery,
            placeholder: "이름, 이메일, 전화 검색",
          }}
          pills={
            <>
              {(
                [
                  ["ALL", `전체 ${counts.all}`],
                  ["ADMIN", `관리자 ${counts.admin}`],
                  ["CUSTOMER", `고객 ${counts.customer}`],
                ] as const
              ).map(([key, label]) => (
                <AdminFilterPill
                  key={key}
                  active={roleFilter === key}
                  onClick={() => setRoleFilter(key)}
                >
                  {label}
                </AdminFilterPill>
              ))}
            </>
          }
        />

        {error ? (
          <p className="border-b border-red-100 bg-red-50 px-5 py-2 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <AdminEmptyState
            icon={<Users className="h-12 w-12" />}
            title={
              users.length === 0
                ? "등록된 계정이 없습니다"
                : "검색 결과가 없습니다"
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className={adminTableHeadClass()}>
                    <th className="px-4 py-3">계정</th>
                    <th className="px-3 py-3">권한</th>
                    <th className="px-3 py-3">주문</th>
                    <th className="px-3 py-3">가입일</th>
                    <th className="px-3 py-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((u) => {
                    const isSelf = u.id === currentUserId;
                    const busy = busyId === u.id;
                    return (
                      <tr key={u.id} className={adminTableRowClass()}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                              {u.name.slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">
                                {u.name}
                                {isSelf ? (
                                  <span className="ml-1.5 text-[11px] font-medium text-indigo-600">
                                    나
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {u.email}
                              </p>
                              {u.phone ? (
                                <p className="text-[11px] text-slate-400">
                                  {u.phone}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={u.role}
                            disabled={busy || isSelf}
                            onChange={(e) =>
                              void changeRole(u, e.target.value as UserRole)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none disabled:opacity-50"
                          >
                            <option value="CUSTOMER">고객</option>
                            <option value="ADMIN">관리자</option>
                          </select>
                        </td>
                        <td className="px-3 py-3 tabular-nums text-slate-600">
                          {u.orderCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                          {formatAdminDate(u.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={busy || isSelf}
                              onClick={() => void remove(u)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              aria-label="계정 삭제"
                            >
                              {busy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-50 xl:hidden">
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id;
                return (
                  <li key={u.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {u.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">
                            {u.name}
                            {isSelf ? (
                              <span className="ml-1.5 text-[11px] text-indigo-600">
                                나
                              </span>
                            ) : null}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {u.email}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            주문 {u.orderCount} · {formatAdminDate(u.createdAt)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busy || isSelf}
                        onClick={() => void remove(u)}
                        className="rounded-lg border border-slate-200 p-2 text-slate-400 disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <select
                      value={u.role}
                      disabled={busy || isSelf}
                      onChange={(e) =>
                        void changeRole(u, e.target.value as UserRole)
                      }
                      className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="CUSTOMER">고객</option>
                      <option value="ADMIN">관리자</option>
                    </select>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </AdminListCard>
    </AdminPageShell>
  );
}
