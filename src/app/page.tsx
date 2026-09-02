import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { fetchHomeCatalog } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: "대지나염 | 정직한 단체티 나염",
  },
  description:
    "반팔티, 카라티, 후드·맨투맨을 나염으로 1장부터 제작하세요. 베스트·신상품을 한곳에서 확인하세요.",
  openGraph: {
    title: "대지나염 | 정직한 단체티 나염",
    description:
      "반팔티, 카라티, 후드·맨투맨을 나염으로 1장부터 제작하세요.",
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
