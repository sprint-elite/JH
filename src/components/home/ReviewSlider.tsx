"use client";

import { ReviewCard } from "./ReviewCard";
import type { ProductType } from "@/types/builder";

export type HomeReviewSlide = {
  id: string;
  user: string;
  date: string;
  product: string;
  productType: ProductType;
  productColor: string;
  rating: number;
  text: string;
  hot: boolean;
  category: string;
  href?: string;
};

interface ReviewSliderProps {
  reviews: HomeReviewSlide[];
}

/** 끊김 없이 흘러가는 리뷰 마퀴 */
export function ReviewSlider({ reviews }: ReviewSliderProps) {
  if (reviews.length === 0) return null;

  const loop = [...reviews, ...reviews];

  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-50 to-transparent sm:w-12"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-50 to-transparent sm:w-12"
        aria-hidden
      />
      <div className="animate-review-marquee flex w-max gap-4 py-1">
        {loop.map((review, i) => (
          <div
            key={`${review.id}-${i}`}
            className="w-[300px] shrink-0 sm:w-[320px]"
          >
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  );
}
