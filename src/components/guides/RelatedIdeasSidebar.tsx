"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { HomeContentCard } from "@/lib/content-article";

export function RelatedIdeasSidebar({ items }: { items: HomeContentCard[] }) {
  const ref = useRef<HTMLElement>(null);
  const [stickyTop, setStickyTop] = useState(204);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || items.length === 0) return;

    const sync = () => {
      // 헤더 높이 + 섹션 padding = 최초 화면에서의 사이드바 top
      // sticky top을 이 값으로 두면 스크롤 시 위로 끌려가지 않고 바로 고정됨
      const header = document.querySelector("header");
      const headerH = header?.getBoundingClientRect().height ?? 148;
      const parent = el.parentElement;
      const padTop = parent
        ? Number.parseFloat(getComputedStyle(parent).paddingTop) || 0
        : 0;
      setStickyTop(Math.round(headerH + padTop));
    };

    sync();
    const header = document.querySelector("header");
    const ro =
      typeof ResizeObserver !== "undefined" && header
        ? new ResizeObserver(sync)
        : null;
    if (header && ro) ro.observe(header);
    window.addEventListener("resize", sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <aside
      ref={ref}
      className="mt-10 lg:mt-0 lg:sticky lg:self-start"
      style={{ top: stickyTop } satisfies CSSProperties}
    >
      <h2 className="text-sm font-bold leading-none text-zinc-900">
        상황별 추천 아이템
      </h2>
      <ul className="mt-3 space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="group block">
              <div className="relative aspect-[5/4] w-full overflow-hidden rounded-xl bg-zinc-100">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="180px"
                  />
                ) : (
                  <div
                    className={`flex h-full items-center justify-center bg-gradient-to-br ${item.gradient} px-3 text-center text-xs font-semibold text-zinc-700`}
                  >
                    {item.title}
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-medium leading-snug text-zinc-900 group-hover:text-rose-600">
                {item.title}
                {item.subtitle ? (
                  <span className="mt-0.5 block text-[11px] font-normal text-zinc-500">
                    {item.subtitle}
                  </span>
                ) : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/templates"
        className="mt-4 inline-block text-xs font-semibold text-zinc-500 hover:text-zinc-900"
      >
        전체 보기
      </Link>
    </aside>
  );
}
