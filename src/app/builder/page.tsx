import { Suspense } from "react";
import { BuilderPage } from "@/components/builder/BuilderPage";
import { fetchBuilderProductContext } from "@/lib/builder-product-context";
import { fetchProductBySlug, resolveProductType } from "@/lib/catalog";

const DEFAULT_BUILDER_SLUG = "ecobag";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productParam } = await searchParams;
  const slug = productParam?.trim() || DEFAULT_BUILDER_SLUG;
  const [productContext, product] = await Promise.all([
    fetchBuilderProductContext(slug),
    fetchProductBySlug(slug),
  ]);

  const productType = resolveProductType(product?.builderType, slug);

  return (
    <Suspense>
      <BuilderPage
        initialProductSlug={slug}
        productTitle={productContext?.name}
        productType={productType}
        productContext={productContext ?? undefined}
      />
    </Suspense>
  );
}
