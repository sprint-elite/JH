"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { HomePopupDto } from "@/lib/site-popup";

const storageKey = (id: string) => `daeji-popup-hide:${id}`;

function isHidden(id: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(storageKey(id));
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    if (until > Date.now()) return true;
    window.localStorage.removeItem(storageKey(id));
    return false;
  } catch {
    return false;
  }
}

function hideUntil(id: string, hours: number) {
  try {
    if (hours <= 0) {
      window.sessionStorage.setItem(storageKey(id), "1");
      return;
    }
    window.localStorage.setItem(
      storageKey(id),
      String(Date.now() + hours * 60 * 60 * 1000),
    );
  } catch {
    /* ignore */
  }
}

function isSessionHidden(id: string): boolean {
  try {
    return window.sessionStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

export function HomePopup({ popup }: { popup: HomePopupDto }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isHidden(popup.id) || isSessionHidden(popup.id)) return;
    setOpen(true);
  }, [popup.id]);

  if (!open) return null;

  const close = () => setOpen(false);
  const dismiss = () => {
    hideUntil(popup.id, popup.dismissHours);
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[45] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-labelledby="home-popup-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-zinc-500 shadow-sm hover:text-zinc-800"
          aria-label="팝업 닫기"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={popup.imageUrl}
            alt=""
            className="h-48 w-full object-cover"
          />
        ) : null}

        <div className="px-5 py-5">
          <h2
            id="home-popup-title"
            className="text-lg font-bold leading-snug text-zinc-900"
          >
            {popup.title}
          </h2>
          {popup.body ? (
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600">
              {popup.body}
            </p>
          ) : null}
          {popup.linkUrl ? (
            <Link
              href={popup.linkUrl}
              onClick={close}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
            >
              {popup.linkLabel || "자세히 보기"}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full text-center text-[12px] text-zinc-500 underline-offset-2 hover:underline"
          >
            {popup.dismissHours > 0
              ? `${popup.dismissHours === 24 ? "오늘 하루" : `${popup.dismissHours}시간`} 보지 않기`
              : "닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}
