"use client";

import Image from "next/image";
import Link from "next/link";
import { SHOW_HOME_REVIEWS_SECTION } from "@/lib/home-data";
import { PRODUCT_PAGE_CONTAINER } from "@/lib/product-layout";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/** 관리자 사이트설정(DB)을 표시. 불러오기 전에는 site-info 상수로 먼저 그림 */
export function HomeFooter({ wide = false }: { wide?: boolean }) {
  const info = useSiteSettings();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div
        className={`py-12 ${wide ? PRODUCT_PAGE_CONTAINER : "mx-auto max-w-7xl px-4 sm:px-6"}`}
      >
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center text-xl font-black text-zinc-900"
            >
              <Image
                src="/logo3.png"
                alt={info.brandName}
                width={991}
                height={252}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
              반팔티·카라티·후드까지, 로고 나염 단체티를 1장부터 제작합니다.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">About</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/#products" className="hover:text-zinc-900">
                  상품
                </Link>
              </li>
              <li>
                <Link href="/builder" className="hover:text-zinc-900">
                  만들기
                </Link>
              </li>
              {SHOW_HOME_REVIEWS_SECTION ? (
                <li>
                  <Link href="/#reviews" className="hover:text-zinc-900">
                    리뷰
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/faq" className="hover:text-zinc-900">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-zinc-900">
                  교환·반품 안내
                </Link>
              </li>
              <li>
                <Link href="/mypage/returns" className="hover:text-zinc-900">
                  교환·반품 신청
                </Link>
              </li>
              <li>
                <Link href="/inquiry" className="hover:text-zinc-900">
                  1:1 문의
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-zinc-900">
                  비회원 주문조회
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-zinc-900">Legal</p>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-500">
              <li>
                <Link href="/terms" className="hover:text-zinc-900">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-zinc-900">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 space-y-1 border-t border-zinc-200 pt-6 text-xs leading-relaxed text-zinc-400">
          <p>
            {info.companyName} · 대표 {info.ceoName} · 사업자등록번호{" "}
            {info.businessNumber}
          </p>
          <p>
            통신판매업신고 {info.mailOrderNumber} · {info.address}
          </p>
          <p>
            고객센터: {info.phone} · {info.email} · {info.hours}
          </p>
          {info.bankAccount?.trim() ? (
            <p>
              무통장: {info.bankAccount} ({info.bankHolder})
            </p>
          ) : null}
          <p className="pt-2">
            © {new Date().getFullYear()} {info.brandName}
          </p>
        </div>
      </div>
    </footer>
  );
}
