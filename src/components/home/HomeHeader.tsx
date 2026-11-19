"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { HeaderSearch } from "@/components/home/HeaderSearch";
import { CartNavLink } from "@/components/cart/CartNavLink";
import { TwoMinuteTemplateNavLink } from "@/components/home/TwoMinuteTemplateNavLink";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import {
  categoryNavHref,
  FALLBACK_PRODUCT_LIST_CATEGORIES,
  type ProductListCategory,
} from "@/lib/product-list";
import { SHOW_HOME_REVIEWS_SECTION } from "@/lib/home-data";

const HOME_NAV = [
  { label: "테마별 베스트", href: "/#theme-best" as const },
  { label: "추천 디자인", href: "/#products" },
  { label: "단체티 만들기", href: "/builder" },
];

const NAV_ITEMS = [
  ...(SHOW_HOME_REVIEWS_SECTION
    ? [{ label: "리뷰", href: "/#reviews" as const }]
    : []),
  { label: "제작 가이드", href: "/#guides" },
];

const CATEGORY_NAV_FALLBACK = FALLBACK_PRODUCT_LIST_CATEGORIES.map((c) => ({
  label: c.label,
  href: categoryNavHref(c.slug),
  slug: c.slug,
}));

function useStorefrontCategories() {
  const [categories, setCategories] = useState(CATEGORY_NAV_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { categories?: ProductListCategory[] } | null) => {
          const rows = data?.categories;
          if (cancelled || !rows?.length) return;
          setCategories(
            rows.map((c) => ({
              label: c.label,
              href: categoryNavHref(c.slug),
              slug: c.slug,
            })),
          );
        },
      )
      .catch(() => {
        /* 폴백 유지 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}

function isCategoryNavActive(
  pathname: string,
  slug: string | null,
): boolean {
  if (slug === null) {
    return pathname === "/products/list";
  }
  return pathname === `/products/list/${slug}`;
}
function AuthActions({
  user,
  loading,
  logout,
  compact,
}: {
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  logout: () => Promise<void>;
  compact?: boolean;
}) {
  if (loading) return null;

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <CartNavLink compact={compact} />
      {user ? (
        <>
          <span className="hidden text-xs text-zinc-500 md:inline">
            {user.name}님
          </span>
          <Link
            href="/mypage"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <span className="sm:hidden">마이</span>
            <span className="hidden sm:inline">마이페이지</span>
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            로그아웃
          </button>
        </>
      ) : (
        <>
          <Link
            href="/orders"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            주문조회
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className={`rounded-lg bg-zinc-900 text-sm font-semibold text-white hover:bg-zinc-800 ${
              compact
                ? "hidden px-3 py-1.5 sm:inline"
                : "hidden px-4 py-2 sm:inline"
            }`}
          >
            회원가입
          </Link>
        </>
      )}
      <Link
        href="/builder"
        className={`rounded-full bg-rose-500 font-bold text-white shadow-sm hover:bg-rose-600 ${
          compact ? "px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm" : "px-4 py-2 text-sm"
        }`}
      >
        만들기
      </Link>
    </div>
  );
}

function MobileNavPanel({
  onClose,
  pathname,
}: {
  onClose: () => void;
  pathname: string;
}) {
  const categoryNav = useStorefrontCategories();
  return (
    <div className="border-t border-zinc-100 bg-white px-4 py-3 lg:hidden">
      <HeaderSearch
        compact
        placeholder="상품, 키워드 검색"
        className="mb-3"
      />
      <div className="flex flex-col gap-0.5">
        {HOME_NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            {item.label}
          </Link>
        ))}
        <div className="rounded-lg px-3 py-2.5">
          <TwoMinuteTemplateNavLink onClick={onClose} />
        </div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            {item.label}
          </Link>
        ))}
        <div className="my-2 border-t border-zinc-100" />
        {categoryNav.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className={`rounded-lg px-3 py-2.5 text-sm ${
              isCategoryNavActive(pathname, item.slug)
                ? "font-semibold text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </Link>
        ))}
        <div className="my-2 border-t border-zinc-100" />
        <Link
          href="/mypage"
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          마이페이지
        </Link>
        <Link
          href="/orders"
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          비회원 주문조회
        </Link>
        <Link
          href="/inquiry"
          onClick={onClose}
          className="rounded-lg px-3 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
        >
          1:1 문의
        </Link>
      </div>
    </div>
  );
}

/** 상품 상세: 마플 스타일 한 줄 헤더 */
function ProductHeaderBar({
  containerClass,
  user,
  loading,
  logout,
  pathname,
}: {
  containerClass: string;
  user: ReturnType<typeof useAuth>["user"];
  loading: boolean;
  logout: () => Promise<void>;
  pathname: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const categoryNav = useStorefrontCategories();
  const { brandName } = useSiteSettings();

  return (
    <>
      <div
        className={`flex min-h-14 items-center gap-3 overflow-visible border-b border-zinc-200 pt-1.5 sm:min-h-16 sm:gap-4 sm:pt-2 ${containerClass}`}
      >
        <button
          type="button"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/"
          className="flex shrink-0 items-center text-lg font-black tracking-tighter text-zinc-900 sm:text-xl"
        >
          <Image
            src="/logo3.png"
            alt={brandName}
            width={991}
            height={252}
            priority
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-visible lg:flex">
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto scrollbar-hide">
            {categoryNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`shrink-0 px-2.5 py-2 text-sm transition ${
                  isCategoryNavActive(pathname, item.slug)
                    ? "font-semibold text-zinc-900"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <span className="mx-1 h-4 w-px shrink-0 bg-zinc-200" />
          <TwoMinuteTemplateNavLink className="shrink-0 px-2.5 py-2" />
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 px-2.5 py-2 text-sm font-medium text-zinc-800 hover:text-rose-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <HeaderSearch
          compact
          placeholder="상품, 키워드 검색"
          className="hidden max-w-xs flex-1 xl:block"
        />

        <div className="ml-auto shrink-0">
          <AuthActions
            user={user}
            loading={loading}
            logout={logout}
            compact
          />
        </div>
      </div>
      {menuOpen ? (
        <MobileNavPanel
          pathname={pathname}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}
    </>
  );
}

export function HomeHeader({ wide = false }: { wide?: boolean }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const categoryNav = useStorefrontCategories();
  const { brandName } = useSiteSettings();
  const containerClass = wide
    ? PRODUCT_PAGE_CONTAINER
    : "mx-auto max-w-7xl px-4 sm:px-6";

  if (wide) {
    return (
      <header className="sticky top-0 z-50 overflow-visible bg-white shadow-sm">
        <ProductHeaderBar
          containerClass={containerClass}
          user={user}
          loading={loading}
          logout={logout}
          pathname={pathname}
        />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 overflow-visible bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-900 px-4 py-2 text-center text-xs text-zinc-300">
        <span className="font-semibold text-white">{brandName}</span>
        <span className="mx-2 text-zinc-600">|</span>
        단체티 나염 1장부터 제작 · 3~5일 평균 출고 · 작업 코멘트 실시간 확인
      </div>

      <div className={`flex h-16 items-center gap-4 ${containerClass}`}>
        <button
          type="button"
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          aria-label={menuOpen ? "메뉴 닫기" : "메뉴"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link
          href="/"
          className="flex shrink-0 items-center text-2xl font-black tracking-tighter text-zinc-900"
        >
          <Image
            src="/logo3.png"
            alt={brandName}
            width={991}
            height={252}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <HeaderSearch
          placeholder="상품, 브랜드, 키워드 검색"
          className="mx-auto hidden max-w-xl flex-1 lg:block"
        />

        <div className="ml-auto">
          <AuthActions user={user} loading={loading} logout={logout} />
        </div>
      </div>

      {menuOpen ? (
        <MobileNavPanel
          pathname={pathname}
          onClose={() => setMenuOpen(false)}
        />
      ) : null}

      <nav className="hidden overflow-visible border-t border-zinc-100 lg:block">
        <div className={`flex min-h-[52px] items-center gap-1 py-1.5 ${containerClass}`}>
          <div className="flex shrink-0 items-center gap-1">
            {HOME_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex shrink-0 items-center px-3 py-2 text-sm font-semibold text-zinc-800 hover:text-rose-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <span className="mx-2 h-4 w-px shrink-0 bg-zinc-200" />
          <TwoMinuteTemplateNavLink className="shrink-0 px-3" />
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex shrink-0 items-center px-3 py-2 text-sm font-semibold text-zinc-800 hover:text-rose-600"
              >
                {item.label}
              </Link>
            ))}
            <span className="mx-2 h-4 w-px shrink-0 bg-zinc-200" />
            {categoryNav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex shrink-0 items-center px-3 py-2 text-sm transition ${
                  isCategoryNavActive(pathname, item.slug)
                    ? "font-semibold text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
