import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { fetchHomeCatalog } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "JH MAKER | 커스텀 굿즈 제작",
  },
  description:
    "에코백, 장바구니, 파우치를 나만의 디자인으로 1개부터 제작하세요. 베스트·신상품·리뷰를 한곳에서 확인하세요.",
  openGraph: {
    title: "JH MAKER | 커스텀 굿즈 제작",
    description:
      "에코백, 장바구니, 파우치를 나만의 디자인으로 1개부터 제작하세요.",
    url: getSiteUrl(),
  },
  alternates: {
    canonical: getSiteUrl(),
  },
};

export default async function Home() {
  const catalog = await fetchHomeCatalog();
  return <HomePage catalog={catalog} />;
}
