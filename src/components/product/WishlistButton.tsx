"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function WishlistButton({
  productId,
  className,
  showLabel = false,
  label = "찜하기",
  labelActive = "찜됨",
}: {
  productId: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
  labelActive?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setOn(false);
      return;
    }
    let cancelled = false;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data: { items?: Array<{ id: string }> }) => {
        if (!cancelled) {
          setOn(Boolean(data.items?.some((i) => i.id === productId)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, productId]);

  const toggle = async () => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      if (on) {
        await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setOn(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setOn(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      aria-label={on ? labelActive : label}
      className={
        className ??
        (showLabel
          ? "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          : "inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white p-2.5 text-zinc-600 hover:bg-zinc-50")
      }
    >
      <Heart
        className={`h-4 w-4 sm:h-5 sm:w-5 ${on ? "fill-rose-500 text-rose-500" : ""}`}
      />
      {showLabel ? <span>{on ? labelActive : label}</span> : null}
    </button>
  );
}
