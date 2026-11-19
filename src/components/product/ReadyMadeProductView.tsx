"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Loader2, Minus, Plus } from "lucide-react";
import { ShippingAddressFields } from "@/components/checkout/ShippingAddressFields";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useAuth } from "@/hooks/useAuth";
import type { ProductDetailDto } from "@/lib/catalog";
import { PRODUCT_DISPLAY_IMAGES } from "@/lib/home-data";
import {
  calculateReadyMadePrice,
  formatKRW,
  FREE_SHIPPING_THRESHOLD,
  resolveShippingFee,
  SHIPPING_FEE,
} from "@/lib/pricing";
import {
  validateShippingInput,
  type OrderShippingInput,
} from "@/lib/order-shipping";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";

interface ReadyMadeProductViewProps {
  product: ProductDetailDto;
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-4 border-b border-zinc-100 py-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)]">
      <dt className="pt-0.5 text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-zinc-800">{children}</dd>
    </div>
  );
}

export function ReadyMadeProductView({ product }: ReadyMadeProductViewProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [quantity, setQuantity] = useState(product.minQuantity);
  const [submitting, setSubmitting] = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [cartMsg, setCartMsg] = useState<string | null>(null);
  const [successOrderNo, setSuccessOrderNo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [shipping, setShipping] = useState<OrderShippingInput>({
    shippingName: "",
    shippingPhone: "",
    shippingAddress: "",
    shippingZip: "",
    notes: "",
  });

  const price = useMemo(
    () =>
      calculateReadyMadePrice(quantity, {
        basePrice: product.basePrice,
        quantityDiscounts: product.quantityDiscounts,
      }),
    [quantity, product.basePrice, product.quantityDiscounts],
  );

  const shippingFee = resolveShippingFee(price.totalPrice, SHIPPING_FEE);
  const payTotal = price.totalPrice + shippingFee;
  const outOfStock =
    product.stockQuantity != null && product.stockQuantity <= 0;
  const stockShort =
    product.stockQuantity != null &&
    product.stockQuantity > 0 &&
    quantity > product.stockQuantity;

  const imageSrc =
    product.images[0]?.url ??
    product.thumbnailUrl ??
    PRODUCT_DISPLAY_IMAGES[product.productType] ??
    null;
  const noticeText = product.noticeItems
    .map((n) => (n.label ? `${n.label}: ${n.value}` : n.value))
    .filter(Boolean)
    .join("\n");

  const clampQty = (n: number) => {
    const max =
      product.stockQuantity != null
        ? Math.min(product.maxQuantity, product.stockQuantity)
        : product.maxQuantity;
    return Math.min(max, Math.max(product.minQuantity, n));
  };

  const requireLogin = () => {
    router.push(
      `/login?next=${encodeURIComponent(`/products/${product.slug}`)}`,
    );
  };

  const addToCart = async () => {
    setError(null);
    setCartMsg(null);
    if (!user) {
      requireLogin();
      return;
    }
    setAddingCart(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          quantity,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "장바구니 담기 실패");
      setCartMsg("장바구니에 담았습니다.");
      setBuyOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "장바구니 담기 실패");
    } finally {
      setAddingCart(false);
    }
  };

  const submit = async () => {
    setError(null);
    const shippingError = validateShippingInput(shipping);
    if (shippingError) {
      setError(shippingError);
      setBuyOpen(true);
      return;
    }
    if (!user) {
      const email = guestEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        setError("비회원 주문 시 이메일을 입력해 주세요.");
        setBuyOpen(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const endpoint = user
        ? "/api/orders/ready-made"
        : "/api/orders/guest-ready-made";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          quantity,
          ...shipping,
          ...(user ? {} : { email: guestEmail.trim().toLowerCase() }),
        }),
      });
      const data = (await res.json()) as {
        order?: { id: string; orderNumber: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "주문에 실패했습니다.");
      if (data.order?.id) {
        router.push(`/checkout/${data.order.id}`);
        return;
      }
      setSuccessOrderNo(data.order?.orderNumber ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className={`${PRODUCT_PAGE_CONTAINER} py-6 sm:py-10`}>
        <nav className="mb-6 text-xs text-zinc-400" aria-label="breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-zinc-700">
                홈
              </Link>
            </li>
            <li aria-hidden>/</li>
            {product.categoryName ? (
              <>
                <li>
                  <Link
                    href={`/products/list/${product.categorySlug ?? (product.productType === "shopping-bag" ? "polo" : product.productType === "pouch" ? "hoodie" : "tee")}`}
                    className="hover:text-zinc-700"
                  >
                    {product.categoryName}
                  </Link>
                </li>
                <li aria-hidden>/</li>
              </>
            ) : null}
            <li className="text-zinc-700">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* 이미지 — 카드 없음 */}
          <div className="relative aspect-square w-full bg-zinc-50">
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="object-contain p-6 sm:p-10"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                상품 이미지
              </div>
            )}
          </div>

          {/* 구매 정보 — 표형 레이아웃 */}
          <div className="flex min-w-0 flex-col">
            <p className="text-xs font-medium text-zinc-500">기성품</p>
            <h1 className="mt-1 text-2xl font-bold leading-snug text-zinc-900 sm:text-[28px]">
              {product.name}
            </h1>

            <dl className="mt-6 border-t border-zinc-200">
              <InfoRow label="상품명">{product.name}</InfoRow>
              <InfoRow label="판매가">
                <span className="text-lg font-bold text-zinc-900">
                  {formatKRW(price.unitPrice)}
                </span>
                {price.unitPrice < product.basePrice ? (
                  <span className="ml-2 text-sm text-zinc-400 line-through">
                    {formatKRW(product.basePrice)}
                  </span>
                ) : null}
                <span className="ml-1 text-xs text-zinc-400">/개</span>
              </InfoRow>
              <InfoRow label="배송비">
                {shippingFee === 0 ? (
                  <span className="font-semibold text-zinc-900">무료</span>
                ) : (
                  <>
                    <span className="font-semibold text-zinc-900">
                      {formatKRW(SHIPPING_FEE)}
                    </span>
                    <span className="text-zinc-500">
                      {" "}
                      ({formatKRW(FREE_SHIPPING_THRESHOLD)} 이상 구매 시 무료)
                    </span>
                  </>
                )}
              </InfoRow>
              {product.shortDesc ? (
                <InfoRow label="설명">{product.shortDesc}</InfoRow>
              ) : null}
              {(noticeText || product.bulkLabel) && (
                <InfoRow label="정보">
                  <div className="whitespace-pre-line leading-relaxed text-zinc-600">
                    {noticeText || product.bulkLabel}
                  </div>
                </InfoRow>
              )}
              {product.stockQuantity != null ? (
                <InfoRow label="재고">
                  {product.stockQuantity <= 0
                    ? "품절"
                    : `${product.stockQuantity.toLocaleString()}개`}
                </InfoRow>
              ) : null}
              <InfoRow label="수량">
                <div className="inline-flex items-center border border-zinc-300">
                  <button
                    type="button"
                    className="px-3 py-2 text-zinc-600 hover:bg-zinc-50"
                    onClick={() => setQuantity((q) => clampQty(q - 1))}
                    disabled={outOfStock}
                    aria-label="수량 감소"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={product.minQuantity}
                    max={
                      product.stockQuantity != null
                        ? Math.min(product.maxQuantity, product.stockQuantity)
                        : product.maxQuantity
                    }
                    value={quantity}
                    disabled={outOfStock}
                    onChange={(e) =>
                      setQuantity(clampQty(Number(e.target.value) || 1))
                    }
                    className="w-14 border-x border-zinc-300 py-2 text-center text-sm tabular-nums outline-none"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 text-zinc-600 hover:bg-zinc-50"
                    onClick={() => setQuantity((q) => clampQty(q + 1))}
                    disabled={outOfStock}
                    aria-label="수량 증가"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-zinc-400">
                  (최소주문수량 {product.minQuantity}개 이상
                  {product.maxQuantity < 9999
                    ? ` / 최대 ${product.maxQuantity}개`
                    : ""}
                  )
                </p>
                {stockShort ? (
                  <p className="mt-1 text-xs text-red-600">
                    재고가 {product.stockQuantity?.toLocaleString()}개까지
                    가능합니다.
                  </p>
                ) : null}
              </InfoRow>
            </dl>

            {product.quantityDiscounts.some((d) => d.unitPrice != null) ? (
              <div className="mt-3 space-y-1 text-xs text-zinc-500">
                {product.quantityDiscounts
                  .filter((d) => d.unitPrice != null)
                  .map((d) => (
                    <p key={d.minQuantity}>
                      {d.minQuantity}개 이상{" "}
                      <span className="font-medium text-zinc-800">
                        {formatKRW(d.unitPrice!)}
                      </span>
                    </p>
                  ))}
              </div>
            ) : null}

            <div className="mt-6 flex items-end justify-between border-y border-zinc-200 py-4">
              <div>
                <p className="text-xs tracking-wide text-zinc-500">
                  TOTAL (QUANTITY)
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  상품 {formatKRW(price.totalPrice)} + 배송{" "}
                  {shippingFee === 0 ? "무료" : formatKRW(shippingFee)}
                </p>
              </div>
              <p className="text-right">
                <span className="text-2xl font-bold text-zinc-900">
                  {formatKRW(payTotal)}
                </span>
                <span className="ml-1 text-sm text-zinc-500">
                  ({quantity}개)
                </span>
              </p>
            </div>

            {successOrderNo ? (
              <p className="mt-6 text-sm text-emerald-700">
                주문이 접수되었습니다. ({successOrderNo})
              </p>
            ) : outOfStock ? (
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled
                  className="min-w-[140px] flex-1 bg-zinc-300 px-4 py-3.5 text-sm font-bold tracking-wide text-white"
                >
                  SOLD OUT
                </button>
                <WishlistButton
                  productId={product.id}
                  showLabel
                  label="WISH LIST"
                  labelActive="WISH LIST"
                  className="inline-flex min-w-[120px] items-center justify-center gap-1.5 border border-zinc-300 bg-white px-4 py-3.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                />
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={authLoading || stockShort}
                    onClick={() => {
                      setError(null);
                      setBuyOpen(true);
                    }}
                    className="flex-1 bg-zinc-900 px-4 py-3.5 text-sm font-bold tracking-wide text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {user ? "BUY IT NOW" : "비회원 바로 구매"}
                  </button>
                  <button
                    type="button"
                    disabled={addingCart || authLoading || stockShort}
                    onClick={() => void addToCart()}
                    className="flex-1 border border-zinc-900 bg-white px-4 py-3.5 text-sm font-bold tracking-wide text-zinc-900 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {addingCart ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        CART
                      </span>
                    ) : (
                      "CART"
                    )}
                  </button>
                  <WishlistButton
                    productId={product.id}
                    showLabel
                    label="WISH LIST"
                    labelActive="WISH LIST"
                    className="inline-flex flex-1 items-center justify-center gap-1.5 border border-zinc-300 bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-zinc-800 hover:bg-zinc-50"
                  />
                </div>

                {cartMsg ? (
                  <p className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                    <Check className="h-4 w-4" />
                    {cartMsg}{" "}
                    <Link href="/cart" className="font-semibold underline">
                      장바구니 보기
                    </Link>
                  </p>
                ) : null}

                {buyOpen ? (
                  <div className="space-y-4 border border-zinc-200 bg-zinc-50 p-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      배송 정보
                    </p>
                    {!user ? (
                      <label className="block text-sm">
                        <span className="mb-1.5 block text-xs font-medium text-zinc-500">
                          비회원 주문 이메일
                        </span>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          disabled={submitting}
                          placeholder="order@example.com"
                          className="w-full border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                        />
                        <p className="mt-1 text-xs text-zinc-400">
                          이미 가입된 이메일이면{" "}
                          <button
                            type="button"
                            className="underline"
                            onClick={requireLogin}
                          >
                            로그인
                          </button>
                          후 주문해 주세요.
                        </p>
                      </label>
                    ) : null}
                    <ShippingAddressFields
                      value={shipping}
                      onChange={setShipping}
                      disabled={submitting}
                      compact
                    />
                    <button
                      type="button"
                      disabled={submitting || stockShort}
                      onClick={() => void submit()}
                      className="inline-flex w-full items-center justify-center gap-2 bg-zinc-900 px-4 py-3.5 text-sm font-bold text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      {formatKRW(payTotal)} 결제하러 가기
                    </button>
                  </div>
                ) : null}

                {error ? (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
