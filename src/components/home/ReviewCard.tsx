import Link from "next/link";
import { Flame, Star } from "lucide-react";
import { ProductVisual } from "./ProductVisual";
import { SITE_INFO } from "@/lib/site-info";

interface ReviewCardProps {
  review: {
    user: string;
    date: string;
    product: string;
    productType: import("@/types/builder").ProductType;
    productColor: string;
    rating: number;
    text: string;
    hot: boolean;
    category: string;
    href?: string;
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const moreHref = review.href ?? "/builder";
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="flex gap-4 p-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-50">
          <ProductVisual
            productType={review.productType}
            color={review.productColor}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-zinc-400">
            {review.product} 구매
          </p>
          <p className="mt-0.5 text-xs font-semibold text-zinc-800">
            제작 후기
          </p>
          {review.hot && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
              <Flame className="h-3 w-3" />
              {SITE_INFO.brandName} 리얼 후기 Hot
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{review.user}</span>
          <span className="text-xs text-zinc-400">{review.date}</span>
        </div>
        <div className="mt-2 flex items-center gap-0.5">
          {Array.from({ length: review.rating }).map((_, i) => (
            <Star
              key={i}
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
            />
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700 line-clamp-3">
          {review.text}
        </p>
        <Link
          href={moreHref}
          className="mt-3 inline-block text-xs font-medium text-zinc-500 hover:text-zinc-900"
        >
          {review.category} 더보기 →
        </Link>
      </div>
    </article>
  );
}
