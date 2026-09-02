"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeBannerDto } from "@/lib/catalog";

const GAP = 20;
const AUTOPLAY_MS = 5500;
const TRANSITION_MS = 550;
const SWIPE_THRESHOLD = 48;
const TARGET_SLIDE_W = 1200;
const TARGET_SLIDE_H = 450;

const SLIDE_TONES = [
  "#ececec",
  "#f4ead4",
  "#f4dde6",
  "#dce8f2",
  "#e3efe4",
  "#ebe4f3",
];

function slideLayout(viewportW: number) {
  if (viewportW >= TARGET_SLIDE_W + 80) {
    const slideWidth = TARGET_SLIDE_W;
    const peek = (viewportW - slideWidth) / 2;
    return { slideWidth, peek, slideHeight: TARGET_SLIDE_H };
  }
  const minPeek = viewportW < 640 ? 40 : 64;
  const slideWidth = Math.max(240, viewportW - minPeek * 2);
  const peek = (viewportW - slideWidth) / 2;
  const slideHeight = Math.round((slideWidth / TARGET_SLIDE_W) * TARGET_SLIDE_H);
  return { slideWidth, peek, slideHeight };
}

function splitTitle(title: string) {
  const lines = title.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    line1: lines[0] ?? title,
    line2: lines.slice(1).join(" ") || null,
  };
}

function realIndex(index: number, total: number) {
  if (total <= 1) return 0;
  if (index === 0) return total - 1;
  if (index === total + 1) return 0;
  return index - 1;
}

interface HeroCarouselProps {
  banners: HomeBannerDto[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; active: boolean } | null>(null);
  const draggedRef = useRef(false);
  const animatingRef = useRef(false);
  const indexRef = useRef(0);
  const settleTimerRef = useRef<number>(0);

  const total = banners.length;
  const looped =
    total > 1 ? [banners[total - 1]!, ...banners, banners[0]!] : banners;

  const [index, setIndex] = useState(total > 1 ? 1 : 0);
  const [viewportW, setViewportW] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  indexRef.current = index;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const sync = () => setViewportW(el.clientWidth);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { peek, slideWidth, slideHeight } = slideLayout(viewportW);
  const offset = viewportW
    ? peek - index * (slideWidth + GAP)
    : 0;

  const finishMove = useCallback(() => {
    window.clearTimeout(settleTimerRef.current);
    const i = indexRef.current;
    if (total > 1 && (i === 0 || i === total + 1)) {
      const reset = i === 0 ? total : 1;
      setAnimate(false);
      setIndex(reset);
      indexRef.current = reset;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimate(true);
          animatingRef.current = false;
        });
      });
      return;
    }
    animatingRef.current = false;
  }, [total]);

  const go = useCallback(
    (dir: -1 | 1) => {
      if (total <= 1 || animatingRef.current) return;
      const next = indexRef.current + dir;
      if (next < 0 || next > total + 1) return;
      animatingRef.current = true;
      setAnimate(true);
      setIndex(next);
      indexRef.current = next;
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(finishMove, TRANSITION_MS + 40);
    },
    [total, finishMove],
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, go, total]);

  useEffect(() => {
    return () => window.clearTimeout(settleTimerRef.current);
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (total <= 1 || e.button !== 0) return;
    dragRef.current = { x: e.clientX, active: true };
    draggedRef.current = false;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag?.active) return;
    if (Math.abs(e.clientX - drag.x) > 8) draggedRef.current = true;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag?.active || total <= 1) return;
    const dx = e.clientX - drag.x;
    if (dx > SWIPE_THRESHOLD) go(-1);
    else if (dx < -SWIPE_THRESHOLD) go(1);
  };

  if (total === 0) return null;

  const current = realIndex(index, total) + 1;

  return (
    <section
      className="bg-white pb-6 pt-4 sm:pb-8 sm:pt-5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="메인 배너"
    >
      <div
        ref={viewportRef}
        className="relative w-full touch-pan-y overflow-hidden select-none"
        style={{ height: viewportW ? slideHeight : TARGET_SLIDE_H }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {viewportW > 0 ? (
        <>
        <div
          className="flex will-change-transform"
          style={{
            gap: GAP,
            transform: `translate3d(${offset}px, 0, 0)`,
            transition: animate
              ? `transform ${TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
              : "none",
          }}
        >
          {looped.map((slide, slideIndex) => {
            const { line1, line2 } = splitTitle(slide.title);
            const slideReal = realIndex(slideIndex, total);
            const tone = SLIDE_TONES[slideReal % SLIDE_TONES.length];
            const imageUrl = slide.imageUrl ?? "";
            const isFullBleed =
              imageUrl.length > 0 &&
              (slideReal <= 1 || imageUrl.startsWith("/images/main-banner"));

            return (
              <Link
                key={`${slide.id}-${slideIndex}`}
                href={slide.linkUrl}
                draggable={false}
                onClick={(e) => {
                  if (draggedRef.current) e.preventDefault();
                }}
                className="relative block shrink-0 overflow-hidden rounded-[20px]"
                style={{
                  width: slideWidth,
                  height: slideHeight,
                  backgroundColor: isFullBleed ? undefined : tone,
                }}
                aria-hidden={slideReal !== realIndex(index, total)}
              >
                {slide.imageUrl ? (
                  isFullBleed ? (
                    <Image
                      src={slide.imageUrl}
                      alt=""
                      fill
                      priority={slideIndex === (total > 1 ? 1 : 0)}
                      draggable={false}
                      className="object-cover object-[center_30%]"
                      sizes="1200px"
                    />
                  ) : (
                    <div className="absolute inset-y-0 right-0 w-[48%] sm:w-[46%] lg:w-[44%]">
                      <Image
                        src={slide.imageUrl}
                        alt=""
                        fill
                        draggable={false}
                        className="object-contain object-bottom object-right p-2 sm:p-4"
                        sizes="1200px"
                      />
                    </div>
                  )
                ) : null}

                <div className="relative z-10 flex h-full max-w-[58%] flex-col justify-center px-6 sm:max-w-[54%] sm:px-12 lg:px-16">
                  {slide.tag ? (
                    <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500 sm:mb-3 sm:text-xs">
                      {slide.tag}
                    </span>
                  ) : null}
                  <h2 className="tracking-tight">
                    <span className="block text-[1.5rem] font-extrabold leading-[1.2] text-zinc-900 sm:text-[2.15rem] lg:text-[2.6rem]">
                      {line1}
                    </span>
                    {line2 ? (
                      <span className="mt-0.5 block text-[1.5rem] font-extrabold leading-[1.2] text-rose-800 sm:text-[2.15rem] lg:text-[2.6rem]">
                        {line2}
                      </span>
                    ) : null}
                  </h2>
                  {slide.subtitle ? (
                    <p className="mt-3 hidden max-w-md whitespace-pre-line text-[13px] leading-relaxed text-zinc-500 sm:mt-4 sm:block sm:text-[15px]">
                      {slide.subtitle}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1/2 z-20 -translate-y-1/2 text-zinc-400/80 transition hover:text-zinc-600"
              style={{ left: peek + 8 }}
              aria-label="이전 배너"
            >
              <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute top-1/2 z-20 -translate-y-1/2 text-zinc-400/80 transition hover:text-zinc-600"
              style={{ right: peek + 8 }}
              aria-label="다음 배너"
            >
              <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={1.5} />
            </button>
            <div
              className="absolute bottom-3 z-20 rounded-full bg-zinc-800/75 px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-wide text-white sm:bottom-4 sm:px-3 sm:text-xs"
              style={{ right: peek + 16 }}
              aria-live="polite"
            >
              {current} / {total}
            </div>
          </>
        ) : null}
        </>
        ) : null}
      </div>
    </section>
  );
}
