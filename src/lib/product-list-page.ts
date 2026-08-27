import { fetchProductList } from "@/lib/catalog";
import {
  fetchProductListCategories,
  parseProductListSort,
} from "@/lib/product-list";
import { fetchStorefrontCategories } from "@/lib/admin-catalog";

export async function loadProductListPage(
  categorySlug: string | null,
  sortParam?: string,
) {
  const sort = parseProductListSort(sortParam);
  const [products, categories, listCategories] = await Promise.all([
    fetchProductList({ categorySlug, sort }),
    fetchStorefrontCategories(),
    fetchProductListCategories(),
  ]);

  const counts: Record<string, number> = {
    all: categories.reduce((sum, c) => sum + c._count.products, 0),
  };
  for (const c of categories) {
    counts[c.slug] = c._count.products;
  }

  return { products, sort, counts, listCategories };
}
