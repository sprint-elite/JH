"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogProductDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES } from "@/lib/home-data";

const THEMES: {
  id: string;
  label: string;
  match: (p: CatalogProductDto) => boolean;
}[] = [
  { id: "featured", label: "인기", match: (p) => p.isFeatured },
  {
    id: "tshirts",
    label: "티셔츠",
    match: (p) => p.categorySlug === "01-tshirts",
  },
  {
    id: "dry",
    label: "드라이",
    match: (p) => p.categorySlug === "02-dry-mesh",
  },
  {
    id: "polo",
    label: "폴로",
    match: (p) => p.categorySlug === "03-polo",
  },
  {
    id: "sweat",
    label: "스웨트",
    match: (p) => p.categorySlug === "04-sweat",
  },
  {
    id: "others",
    label: "기타",
    match: (p) => p.categorySlug === "05-others",
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function pickThemeProducts(
  products: CatalogProductDto[],
  themeId: string,
): CatalogProductDto[] {
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0]!;
  const matched = products.filter(theme.match);
  const rest = products.filter((p) => !matched.some((m) => m.id === p.id));
  return [...matched, ...rest].slice(0, 3);
}

function ThemeProductCard({ item }: { item: CatalogProductDto }) {
  const href = `/products/${item.slug}`;
  const imageSrc = item.thumbnailUrl || PRODUCT_DISPLAY_IMAGES[item.productType];
  const groupPrice = item.groupPrice;
  const hasDeal = groupPrice != null && groupPrice < item.basePrice;
  const colors = item.colors.slice(0, 8);

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-[0_1px_0_rgba(0,0,0,0.03)] transition hover:border-zinc-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item.name}
            fill
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
        ) : null}
      </div>

      {colors.length > 0 ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {colors.map((hex) => (
            <span
              key={hex}
              className="h-3 w-3 rounded-[3px] ring-1 ring-zinc-200/80"
              style={{ backgroundColor: hex }}
              aria-hidden
            />
          ))}
        </div>
      ) : null}

      {item.sizeRange ? (
        <p className="mt-2 text-[11px] text-zinc-400">{item.sizeRange}</p>
      ) : null}

      <h3 className="mt-1.5 line-clamp-2 min-h-[2.4rem] text-[15px] font-semibold leading-snug text-zinc-900">
        {item.name}
      </h3>

      <div className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
        {hasDeal ? (
          <span className="text-[12px] text-zinc-400 line-through">
            {formatPrice(item.basePrice)}원
          </span>
        ) : null}
        <span className="text-[17px] font-bold tracking-tight text-zinc-900">
          {formatPrice(hasDeal ? groupPrice : item.basePrice)}원
        </span>
        {hasDeal ? (
          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
            단체할인가
          </span>
        ) : (
          <span className="text-[11px] font-medium text-zinc-400">1장부터</span>
        )}
      </div>
    </Link>
  );
}

export function ThemeBestSection({
  products,
}: {
  products: CatalogProductDto[];
}) {
  const [themeId, setThemeId] = useState(THEMES[0]!.id);
  const items = useMemo(
    () => pickThemeProducts(products, themeId),
    [products, themeId],
  );

  if (products.length === 0) return null;

  return (
    <section id="theme-best" className="bg-zinc-50/80 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] text-rose-500">
              PICKS
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
              테마별 베스트
            </h2>
          </div>
          <p className="text-sm text-zinc-500">용도에 맞는 단체티를 골라 보세요</p>
        </div>

        <div
          className="mt-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label="테마별 베스트"
        >
          {THEMES.map((theme) => {
            const active = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setThemeId(theme.id)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition sm:px-3.5 sm:text-sm ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-800"
                }`}
              >
                {theme.label}
              </button>
            );
          })}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {items.map((item) => (
            <ThemeProductCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
