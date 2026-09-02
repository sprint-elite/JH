import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductDetailPage } from "@/components/product/ProductDetailPage";
import { fetchProductDetailBySlug } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";
import { SITE_INFO } from "@/lib/site-info";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductDetailBySlug(slug);
  if (!product) return { title: "상품 없음" };

  const description =
    product.shortDesc ?? product.description ?? `${product.name} 커스텀 제작`;
  const url = `${getSiteUrl()}/products/${product.slug}`;

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | ${SITE_INFO.brandName}`,
      description,
      url,
      type: "website",
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await fetchProductDetailBySlug(slug);
  if (!product) notFound();

  return (
    <Suspense>
      <ProductDetailPage product={product} />
    </Suspense>
  );
}
