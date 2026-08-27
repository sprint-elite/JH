"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function CartNavLink({ compact }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user || user.role === "ADMIN") {
      setCount(0);
      return;
    }
    let cancelled = false;
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data: { cart?: { itemCount?: number } }) => {
        if (!cancelled) setCount(data.cart?.itemCount ?? 0);
      })
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || !user || user.role === "ADMIN") return null;

  return (
    <Link
      href="/cart"
      className={`relative inline-flex items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 ${
        compact ? "p-2" : "p-2"
      }`}
      aria-label="장바구니"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
