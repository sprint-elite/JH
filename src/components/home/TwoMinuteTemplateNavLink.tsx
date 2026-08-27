"use client";

import Link from "next/link";

/** 헤더용: 2분컷 템플릿 + 말풍선 '무료' (릿 위, 수평) */
export function TwoMinuteTemplateNavLink({
  className = "",
  onClick,
}: {
  className?: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  return (
    <Link
      href="/templates"
      onClick={onClick}
      className={`group relative inline-flex shrink-0 items-center ${className}`}
    >
      <span className="relative pr-1 text-sm font-semibold text-zinc-800 transition group-hover:text-rose-600">
        2분컷 템플릿
        <span
          className="animate-free-bubble pointer-events-none absolute -right-3 -top-3.5 z-10 sm:-right-2.5 sm:-top-4"
          aria-hidden
        >
          <span className="relative inline-flex items-center rounded-full bg-[#ff3b5c] px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-tight text-white shadow-sm sm:px-2 sm:text-[10px]">
            무료
            <span className="absolute -bottom-[3px] left-1/2 h-0 w-0 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-[#ff3b5c]" />
          </span>
        </span>
      </span>
    </Link>
  );
}
