"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { splitHighlightParts } from "@/lib/search-highlight";

type ProductSearchHit = {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  thumbnailUrl: string | null;
  basePrice: number;
  categoryName: string | null;
};

type HeaderSearchProps = {
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

function HighlightedName({ name, query }: { name: string; query: string }) {
  const parts = splitHighlightParts(name, query);
  return (
    <span>
      {parts.map((part, i) =>
        part.match ? (
          <span key={i} className="font-semibold text-orange-500">
            {part.text}
          </span>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}

export function HeaderSearch({
  placeholder = "상품, 키워드 검색",
  compact = false,
  className = "",
}: HeaderSearchProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<ProductSearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, startTransition] = useTransition();
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const goToProduct = useCallback(
    (slug: string) => {
      close();
      setQuery("");
      setHits([]);
      startTransition(() => {
        router.push(`/products/${slug}`);
      });
    },
    [close, router],
  );

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setHits([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void fetch(`/api/products/search?q=${encodeURIComponent(q)}&take=8`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("search failed");
          const data = (await res.json()) as { products?: ProductSearchHit[] };
          setHits(data.products ?? []);
          setOpen(true);
          setActiveIndex(-1);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setHits([]);
          setOpen(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 220);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      inputRef.current?.blur();
      return;
    }

    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp") && hits.length) {
      setOpen(true);
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!hits.length) return;
      setOpen(true);
      setActiveIndex((i) => (i + 1) % hits.length);
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!hits.length) return;
      setOpen(true);
      setActiveIndex((i) => (i <= 0 ? hits.length - 1 : i - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      close();
      startTransition(() => {
        router.push(`/products/list?q=${encodeURIComponent(q)}`);
      });
    }
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Search
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-zinc-400 ${
          compact ? "left-3 h-4 w-4" : "left-4 h-4 w-4"
        }`}
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`w-full rounded-full border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-100 [&::-webkit-search-cancel-button]:hidden ${
          compact
            ? "py-2 pl-9 pr-9"
            : "py-2.5 pl-11 pr-10"
        }`}
      />
      {query ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => {
            setQuery("");
            setHits([]);
            close();
            inputRef.current?.focus();
          }}
          className={`absolute top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 ${
            compact ? "right-2" : "right-3"
          }`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}

      {showDropdown ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
        >
          {loading && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-400">검색 중…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">
              &ldquo;{query.trim()}&rdquo;에 대한 상품이 없습니다
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((hit, index) => (
                <li key={hit.id} role="option" aria-selected={index === activeIndex}>
                  <Link
                    id={`${listId}-option-${index}`}
                    href={`/products/${hit.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      goToProduct(hit.slug);
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                      index === activeIndex
                        ? "bg-zinc-50"
                        : "hover:bg-zinc-50"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate text-zinc-900">
                      <HighlightedName name={hit.name} query={query} />
                    </span>
                    {hit.categoryName ? (
                      <span className="shrink-0 text-xs text-zinc-400">
                        {hit.categoryName}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
