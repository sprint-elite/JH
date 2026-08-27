import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { resolveProductType } from "@/lib/catalog";
import { TEMPLATE_COLLECTIONS } from "@/lib/template-collections";
import { TemplatesPageView } from "@/components/templates/TemplatesPageView";

export const metadata: Metadata = {
  title: "2분컷 템플릿",
  description:
    "상황별 굿즈 소개와 추천 상품을 한눈에. 문구·로고만 바꾸면 완성되는 JH MAKER 무료 템플릿.",
};

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const slugs = Array.from(
    new Set(
      TEMPLATE_COLLECTIONS.flatMap((c) => c.items.map((i) => i.productSlug)),
    ),
  );

  const productRows = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      slug: true,
      name: true,
      shortDesc: true,
      basePrice: true,
      builderType: true,
    },
  });

  const bySlug = Object.fromEntries(productRows.map((p) => [p.slug, p]));

  const collections = TEMPLATE_COLLECTIONS.map((col) => ({
    id: col.id,
    ideaSlug: col.ideaSlug,
    title: col.title,
    subtitle: col.subtitle,
    coverImageUrl: col.coverImageUrl,
    products: col.items
      .map((item) => {
        const p = bySlug[item.productSlug];
        if (!p) return null;
        return {
          slug: p.slug,
          name: p.name,
          shortDesc: p.shortDesc,
          basePrice: p.basePrice,
          productType: resolveProductType(p.builderType, p.slug),
          caption: item.caption,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x != null)
      .slice(0, 3),
  })).filter((c) => c.products.length > 0);

  return <TemplatesPageView collections={collections} />;
}
