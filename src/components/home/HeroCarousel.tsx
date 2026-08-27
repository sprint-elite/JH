"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Palette,
  Sparkles,
  Truck,
  Upload,
  ShoppingBag,
  Gift,
  Package,
} from "lucide-react";
import type { HomeBannerDto } from "@/lib/catalog";

const HERO_IMAGE = "/images/final_banner_with_printing_detail.png";

const HERO_FEATURES = [
  { icon: Palette, label: "쉽고 간편한 디자인" },
  { icon: Sparkles, label: "고품질 프리미엄 굿즈" },
  { icon: Truck, label: "빠르고 안전한 배송" },
] as const;

const ECO_BAG_HIGHLIGHTS = [
  { icon: Palette, label: "본체·끈 색상" },
  { icon: Upload, label: "문구·이미지 추가" },
  { icon: ShoppingBag, label: "1개부터 주문" },
] as const;

const POUCH_HIGHLIGHTS = [
  { icon: Sparkles, label: "나만의 패턴" },
  { icon: Package, label: "지퍼 파우치" },
  { icon: Gift, label: "선물·소장용" },
] as const;

function HeroIconRow({
  items,
  accent = false,
}: {
  items: ReadonlyArray<{ icon: typeof Palette; label: string }>;
  accent?: boolean;
}) {
  return (
    <ul className="mt-10 flex max-w-lg items-stretch sm:mt-12">
      {items.map(({ icon: Icon, label }, i) => (
        <li
          key={label}
          className={`flex flex-1 flex-col items-center gap-2 px-3 text-center sm:px-4 ${
            i > 0 ? "border-l border-slate-200/80" : ""
          }`}
        >
          <Icon
            className={`h-[18px] w-[18px] shrink-0 ${
              accent ? "text-sky-500" : "text-slate-400"
            }`}
            strokeWidth={1.75}
          />
          <span className="text-[11px] font-medium leading-snug text-slate-500 sm:text-xs">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeroSlideFooter({ slideIndex }: { slideIndex: number }) {
  if (slideIndex === 0) {
    return <HeroIconRow items={HERO_FEATURES} />;
  }

  if (slideIndex === 1) {
    return <HeroIconRow items={ECO_BAG_HIGHLIGHTS} accent />;
  }

  if (slideIndex === 2) {
    return <HeroIconRow items={POUCH_HIGHLIGHTS} accent />;
  }

  return null;
}

function splitTitle(title: string) {
  const lines = title.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    line1: lines[0] ?? title,
    line2: lines.slice(1).join(" ") || null,
  };
}

interface HeroCarouselProps {
  banners: HomeBannerDto[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;

  const next = useCallback(
    () => setIndex((i) => (total ? (i + 1) % total : 0)),
    [total],
  );
  const prev = useCallback(
    () => setIndex((i) => (total ? (i - 1 + total) % total : 0)),
    [total],
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [paused, next, total]);

  if (total === 0) return null;

  return (
    <section
      className="bg-white pb-10 pt-5 sm:pb-14 sm:pt-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[1.75rem]">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {banners.map((slide, slideIndex) => {
              const { line1, line2 } = splitTitle(slide.title);
              const badge =
                slide.tag ??
                (slideIndex === 0 ? "CUSTOM GOODS STUDIO" : null);
              const isFirstSlide = slideIndex === 0;
              const imageSrc = isFirstSlide
                ? slide.imageUrl ?? HERO_IMAGE
                : slide.imageUrl ?? null;
              const hasImageOverlay = Boolean(imageSrc);

              return (
                <div
                  key={slide.id}
                  className="relative min-h-[520px] min-w-full shrink-0 bg-white lg:min-h-[660px]"
                >
                  {imageSrc && (
                    <Image
                      src={imageSrc}
                      alt={slide.title}
                      fill
                      priority={slideIndex === 0}
                      className="object-cover object-center"
                      sizes="100vw"
                    />
                  )}

                  {hasImageOverlay && (
                    <div
                      className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r ${
                        isFirstSlide
                          ? "from-[#e8f3fc]/95 via-[#eef6fc]/55 to-transparent"
                          : "from-white/92 via-white/70 to-white/20"
                      }`}
                      aria-hidden
                    />
                  )}

                  <div className="absolute inset-0 z-10 flex items-center">
                    <div className="flex w-full max-w-[min(100%,560px)] flex-col justify-center px-8 py-12 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
                      {badge && (
                        <span className="mb-5 inline-flex w-fit rounded-full border border-sky-200/90 bg-white/95 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-500 shadow-sm">
                          {badge}
                        </span>
                      )}

                      <h2 className="tracking-tight">
                        <span className="block text-[2rem] font-extrabold leading-[1.22] text-[#1a2b3c] sm:text-[2.45rem] lg:text-[2.85rem]">
                          {line1}
                        </span>
                        {line2 && (
                          <span className="mt-1 block text-[2rem] font-extrabold leading-[1.22] text-[#3b82f6] sm:text-[2.45rem] lg:text-[2.85rem]">
                            {line2}
                          </span>
                        )}
                      </h2>

                      {slide.subtitle && (
                        <p className="mt-5 max-w-md whitespace-pre-line text-[15px] font-medium leading-[1.75] text-[#64748b] sm:text-base">
                          {slide.subtitle}
                        </p>
                      )}

                      <Link
                        href={slide.linkUrl}
                        className="mt-8 inline-flex w-fit items-center gap-1.5 rounded-2xl bg-[#3b82f6] px-8 py-3.5 text-[15px] font-bold text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)] transition hover:bg-[#2563eb]"
                      >
                        디자인 시작하기
                        <ChevronRight
                          className="h-[18px] w-[18px]"
                          strokeWidth={2.5}
                        />
                      </Link>

                      <HeroSlideFooter slideIndex={slideIndex} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-400 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition hover:bg-white hover:text-zinc-600 sm:left-5"
                aria-label="이전 배너"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-zinc-400 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition hover:bg-white hover:text-zinc-600 sm:right-5"
                aria-label="다음 배너"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`rounded-full transition-all ${
                      i === index
                        ? "h-2 w-6 bg-[#3b82f6]"
                        : "h-2 w-2 bg-zinc-300/90 hover:bg-zinc-400"
                    }`}
                    aria-label={`배너 ${i + 1}`}
                    aria-current={i === index}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
