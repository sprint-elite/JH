import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuideArticleView } from "@/components/guides/GuideArticleView";
import { fetchContentArticleBySlug } from "@/lib/content-article";
import { prisma } from "@/lib/db";
import { resolveProductType } from "@/lib/catalog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

async function loadPage(type: "GUIDE" | "IDEA", slug: string) {
  const article = await fetchContentArticleBySlug(type, slug);
  if (!article) return null;

  const slugs = Array.from(
    new Set(
      article.sections.flatMap((s) => (s.products ?? []).map((p) => p.slug)),
    ),
  );

  const rows = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      slug: true,
      name: true,
      shortDesc: true,
      basePrice: true,
      saleType: true,
      builderType: true,
    },
  });

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

  return { article, productsBySlug };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchContentArticleBySlug("GUIDE", slug);
  if (!article) return { title: "가이드" };
  return { title: article.title, description: article.subtitle };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const data = await loadPage("GUIDE", slug);
  if (!data) notFound();
  return (
    <GuideArticleView
      article={data.article}
      productsBySlug={data.productsBySlug}
    />
  );
}
