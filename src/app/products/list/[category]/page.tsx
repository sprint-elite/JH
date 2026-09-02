import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductListPage } from "@/components/product/ProductListPage";
import {
  getListCategory,
  isValidListCategory,
} from "@/lib/product-list";
import { loadProductListPage } from "@/lib/product-list-page";
import { fetchStorefrontCategories } from "@/lib/admin-catalog";
import { SITE_INFO } from "@/lib/site-info";

type PageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateStaticParams() {
  const cats = await fetchStorefrontCategories();
  return cats.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (!(await isValidListCategory(category))) {
    return { title: "상품 없음" };
  }

  const meta = await getListCategory(category);
  return {
    title: `${meta.label} | ${SITE_INFO.brandName}`,
    description: `${meta.heading} 상품을 둘러보세요.`,
  };
}

export default async function CategoryProductListPage({
  params,
  searchParams,
}: PageProps) {
  const { category } = await params;
  if (!(await isValidListCategory(category))) notFound();

  const { sort: sortParam } = await searchParams;
  const { products, sort, counts, listCategories } = await loadProductListPage(
    category,
    sortParam,
  );

  return (
    <ProductListPage
      categorySlug={category}
      products={products}
      sort={sort}
      counts={counts}
      listCategories={listCategories}
    />
  );
}
