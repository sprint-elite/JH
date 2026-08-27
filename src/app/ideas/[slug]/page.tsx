import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticleView } from "@/components/guides/GuideArticleView";
import {
  fetchContentArticleBySlug,
  fetchRelatedIdeaCards,
} from "@/lib/content-article";
import { prisma } from "@/lib/db";
import { resolveProductType } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchContentArticleBySlug("IDEA", slug);
  if (!article) return { title: "상황별 굿즈" };
  return { title: article.title, description: article.subtitle };
}

export default async function IdeaPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchContentArticleBySlug("IDEA", slug);
  if (!article) notFound();

  const slugs = Array.from(
    new Set(
      article.sections.flatMap((s) => (s.products ?? []).map((p) => p.slug)),
    ),
  );

  const [rows, relatedIdeas] = await Promise.all([
    prisma.product.findMany({
      where: { slug: { in: slugs }, isActive: true },
      select: {
        slug: true,
        name: true,
        shortDesc: true,
        basePrice: true,
        saleType: true,
        builderType: true,
      },
    }),
    fetchRelatedIdeaCards(slug, 3),
  ]);

  const productsBySlug = Object.fromEntries(
    rows.map((p) => [
      p.slug,
      {
        slug: p.slug,
        name: p.name,
        shortDesc: p.shortDesc,
        basePrice: p.basePrice,
        saleType: p.saleType,
        productType: resolveProductType(p.builderType, p.slug),
      },
    ]),
  );

  return (
    <GuideArticleView
      article={article}
      productsBySlug={productsBySlug}
      relatedIdeas={relatedIdeas}
    />
  );
}
