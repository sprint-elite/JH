import type { Metadata } from "next";
import { ProductListPage } from "@/components/product/ProductListPage";
import { getListCategory, parseProductListSort } from "@/lib/product-list";
import { loadProductListPage } from "@/lib/product-list-page";
import { SITE_INFO } from "@/lib/site-info";

type PageProps = {
  searchParams: Promise<{ sort?: string; q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const category = await getListCategory(null);
  const { sort: sortParam, q } = await searchParams;
  void parseProductListSort(sortParam);
  const query = q?.trim();

  return {
    title: query
      ? `"${query}" 검색 | ${SITE_INFO.brandName}`
      : `${category.label} | ${SITE_INFO.brandName}`,
    description: query
      ? `${query} 관련 커스텀·기성 상품을 확인하세요.`
      : "커스텀 제작과 기성품을 둘러보세요.",
  };
}

export default async function AllProductsListPage({ searchParams }: PageProps) {
  const { sort: sortParam, q } = await searchParams;
  const { products, sort, counts, listCategories } = await loadProductListPage(
    null,
    sortParam,
  );

  return (
    <ProductListPage
      categorySlug={null}
      products={products}
      sort={sort}
      counts={counts}
      listCategories={listCategories}
      searchQuery={q ?? ""}
    />
  );
}
