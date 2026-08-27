"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/home/ProductCard";
import type { CatalogProductDto } from "@/lib/catalog";

export function WishlistPageClient({
  initialItems,
}: {
  initialItems: CatalogProductDto[];
}) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);

  const remove = async (productId: string) => {
    setBusyId(productId);
    try {
      const res = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) setItems((prev) => prev.filter((p) => p.id !== productId));
    } finally {
      setBusyId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <Heart className="mx-auto h-10 w-10 text-zinc-300" />
        <p className="mt-3 text-sm text-zinc-500">찜한 상품이 없습니다.</p>
        <Link
          href="/products/list"
          className="mt-4 inline-flex rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          상품 보러가기
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <ProductCard item={item} />
          <button
            type="button"
            disabled={busyId === item.id}
            onClick={() => void remove(item.id)}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow"
          >
            {busyId === item.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4 fill-rose-500 text-rose-500" />
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
