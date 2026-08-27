import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { CatalogProductDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES, PRODUCT_GRADIENTS } from "@/lib/home-data";
import { ProductVisual } from "./ProductVisual";

const PRODUCT_COLORS: Record<string, string> = {
  ecobag: "mint",
  "shopping-bag": "cream",
  pouch: "sky",
  b1: "mint",
  b2: "cream",
  b3: "sky",
  b4: "navy",
  b5: "cream",
  b6: "white",
  b7: "pink",
  b8: "mint",
};

const CIRCLE_SIZE = "h-32 w-32";

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

interface ProductCardProps {
  item: CatalogProductDto;
  compact?: boolean;
  /** circle: 메인 추천 섹션 — 원형 이미지 + 상품명만 */
  /** shop: 하이퀄리티 라인업 — 호버 커스텀 문구 없음 */
  variant?: "default" | "circle" | "shop";
  href?: string;
}

export function ProductCard({
  item,
  compact,
  variant = "default",
  href: hrefOverride,
}: ProductCardProps) {
  const href = hrefOverride ?? `/products/${item.slug}`;
  const imageSrc = item.thumbnailUrl || PRODUCT_DISPLAY_IMAGES[item.productType];
  const hasPhoto = Boolean(imageSrc);

  if (variant === "circle") {
    return (
      <Link
        href={href}
        className="group flex w-[7.5rem] flex-col items-center sm:w-32"
      >
        <div className="relative shrink-0">
          {item.badge && (
            <span className="absolute left-1.5 top-2 z-20 rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white shadow-sm ring-2 ring-white">
              {item.badge}
            </span>
          )}

          <div
            className={`relative ${CIRCLE_SIZE} overflow-hidden rounded-full ${
              hasPhoto
                ? "bg-zinc-100"
                : `bg-gradient-to-br ${PRODUCT_GRADIENTS[item.productType]}`
            }`}
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="128px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ProductVisual
                  productType={item.productType}
                  color={PRODUCT_COLORS[item.slug] ?? "mint"}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <p className="mt-2.5 line-clamp-2 w-full text-center text-sm font-semibold leading-snug text-zinc-900">
          {item.name}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl bg-white transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden ${
          hasPhoto
            ? "bg-white"
            : `bg-gradient-to-br ${PRODUCT_GRADIENTS[item.productType]}`
        }`}
      >
        {item.badge && (
          <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
            {item.badge}
          </span>
        )}
        <span
          className={`absolute right-2.5 top-2.5 z-10 rounded-md px-2 py-0.5 text-[10px] font-bold text-white ${
            item.saleType === "READYMADE" ? "bg-zinc-800" : "bg-emerald-600"
          }`}
        >
          {item.saleType === "READYMADE" ? "기성품" : "커스텀"}
        </span>

        <div className="transition-transform duration-300 group-hover:scale-105">
          {item.thumbnailUrl ? null : (
            <ProductVisual
              productType={item.productType}
              color={
                PRODUCT_COLORS[item.id] ?? PRODUCT_COLORS[item.slug] ?? "mint"
              }
              size={compact ? "sm" : "md"}
            />
          )}
        </div>
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.name}
            fill
            className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : null}

        {variant !== "shop" && (
          <div className="absolute inset-x-0 bottom-0 translate-y-full bg-zinc-900/90 px-3 py-3 text-center text-xs font-semibold text-white transition-transform duration-200 group-hover:translate-y-0 sm:text-sm">
            {item.saleType === "READYMADE"
              ? "기성품 구매하기"
              : "이 상품 커스텀하기"}
          </div>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-3.5"}`}>
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
          {item.name}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
          <span className="text-base font-bold text-zinc-900">
            {formatPrice(item.basePrice)}
          </span>
          <span className="text-[11px] text-zinc-400">부터</span>
        </div>
        {item.bulkLabel && (
          <p className="mt-1 text-[10px] font-medium text-rose-600">
            {item.bulkLabel}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-zinc-800">
            {item.ratingAvg > 0 ? item.ratingAvg.toFixed(2) : "4.97"}
          </span>
          {item.reviewCount > 0 && (
            <span className="text-zinc-400">
              ({item.reviewCount.toLocaleString()})
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
