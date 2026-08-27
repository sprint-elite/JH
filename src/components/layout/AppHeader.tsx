"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/builder", label: "디자인 빌더" },
  { href: "/mypage", label: "마이페이지" },
  { href: "/admin", label: "관리자" },
];

export function AppHeader() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          JH Custom
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {!loading && (
            <div className="flex items-center gap-2 border-l border-zinc-200 pl-2 sm:pl-4">
              {user ? (
                <>
                  <span className="hidden text-xs text-zinc-500 sm:inline">
                    {user.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
