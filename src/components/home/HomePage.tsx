"use client";

import Link from "next/link";
import Image from "next/image";
import { HomeHeader } from "./HomeHeader";
import { HomeFooter } from "./HomeFooter";
import { HeroCarousel } from "./HeroCarousel";
import { SectionHeader } from "./SectionHeader";
import { HomeCircleNav } from "./HomeCircleNav";
import { QuickTemplateCard } from "./QuickTemplateCard";
import { ThemeBestSection } from "./ThemeBestSection";
import type { HomeCatalogDto } from "@/lib/catalog";
import { GUIDE_CARDS, IDEA_BANNERS } from "@/lib/home-data";

interface HomePageProps {
  catalog: HomeCatalogDto;
}

const FALLBACK_IDEA_GRADIENTS = [
  "from-pink-200 to-rose-100",
  "from-amber-200 to-orange-100",
  "from-sky-200 to-blue-100",
  "from-emerald-200 to-green-100",
  "from-stone-200 to-zinc-100",
  "from-zinc-200 to-slate-100",
  "from-rose-100 to-orange-50",
  "from-yellow-100 to-amber-50",
];

const FALLBACK_GUIDE_GRADIENTS = [
  "from-teal-100 to-emerald-50",
  "from-orange-100 to-amber-50",
  "from-blue-100 to-sky-50",
  "from-stone-100 to-zinc-50",
];

function IdeasSection({
  ideas,
}: {
  ideas: {
    title: string;
    subtitle: string;
    href: string;
    gradient: string;
    imageUrl?: string;
  }[];
}) {
  return (
    <section id="ideas" className="bg-white pb-4 pt-10 sm:pb-6 sm:pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeader
          title="이런 상황엔, 이런 티셔츠"
          subtitle="동아리·행사·유니폼까지 활용 아이디어를 모아봤어요"
          href={ideas[0]?.href ?? "/ideas/couple-ecobag"}
          linkLabel="전체 보기"
        />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {ideas.map((idea) =>
            idea.imageUrl ? (
              <Link
                key={idea.title}
                href={idea.href}
                className="group relative aspect-[7/8] w-full overflow-hidden rounded-2xl transition-transform hover:scale-[1.02]"
              >
                <Image
                  src={idea.imageUrl}
                  alt={idea.title}
                  fill
                  className="object-cover object-[center_32%] transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 45vw, 280px"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/50 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-6 text-center sm:px-4 sm:pb-3.5">
                  <p className="text-[13px] font-semibold leading-snug text-white sm:text-sm">
                    {idea.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-white/80">
                    {idea.subtitle}
                  </p>
                </div>
              </Link>
            ) : (
              <Link
                key={idea.title}
                href={idea.href}
                className={`group flex aspect-[7/8] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${idea.gradient} p-4 text-center transition-transform hover:scale-[1.02]`}
              >
                <p className="mt-2 text-sm font-bold text-zinc-900">
                  {idea.title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">{idea.subtitle}</p>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function HomePage({ catalog }: HomePageProps) {
  const { banners, circleNav, best, templates, allProducts } = catalog;

  const ideas =
    catalog.ideas.length > 0
      ? catalog.ideas.map((b, i) => ({
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient:
            b.gradient ||
            FALLBACK_IDEA_GRADIENTS[i % FALLBACK_IDEA_GRADIENTS.length]!,
          imageUrl: b.imageUrl ?? undefined,
        }))
      : IDEA_BANNERS.map((b) => ({
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient: b.gradient,
          imageUrl: b.imageUrl,
        }));

  const guides =
    catalog.guides.length > 0
      ? catalog.guides.map((b, i) => ({
          id: b.id,
          title: b.title,
          subtitle: b.subtitle,
          href: b.href,
          gradient:
            b.gradient ||
            FALLBACK_GUIDE_GRADIENTS[i % FALLBACK_GUIDE_GRADIENTS.length]!,
        }))
      : GUIDE_CARDS.map((g) => ({ ...g }));

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main>
        <HeroCarousel banners={banners} />

        <HomeCircleNav
          items={circleNav.map((item) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            href: item.linkUrl,
          }))}
        />

        {templates.length > 0 && (
          <section id="templates" className="bg-white py-10 sm:py-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <SectionHeader
                title="2분컷, 이렇게 시작해 보세요"
                href="/templates"
                linkLabel="전체 보기"
              />
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                {templates.map((tpl) => (
                  <QuickTemplateCard key={tpl.id} tpl={tpl} />
                ))}
              </div>
            </div>
          </section>
        )}

        {ideas.length > 0 ? <IdeasSection ideas={ideas} /> : null}

        <ThemeBestSection products={allProducts.length ? allProducts : best} />

        <section
          id="guides"
          className="bg-white py-10 sm:py-14"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeader
            title="제작 가이드 & 활용 아이디어"
            subtitle="커스텀 전 꼭 알아두면 좋은 정보"
            href={guides[0]?.href ?? "/guides/ecobag-guide"}
            linkLabel="가이드 보기"
          />
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href={guide.href}
                className={`group flex min-w-[260px] shrink-0 flex-col justify-between rounded-2xl bg-gradient-to-br ${guide.gradient} p-6 lg:min-w-0`}
              >
                <div>
                  <h3 className="text-base font-bold leading-snug text-zinc-900 group-hover:text-rose-700">
                    {guide.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {guide.subtitle}
                  </p>
                </div>
                <span className="mt-4 text-xs font-semibold text-zinc-500 group-hover:text-zinc-800">
                  자세히 보기 →
                </span>
              </Link>
            ))}
          </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 px-8 py-14 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold sm:text-4xl">
                지금 바로 우리 단체티를 만들어 보세요
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-zinc-400">
                로고·문구만 올리면 시안부터 나염 주문까지 이어집니다.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/products/list"
                  className="rounded-full bg-white px-10 py-3.5 text-sm font-bold text-zinc-900 shadow-lg hover:bg-zinc-100"
                >
                  상품 고르고 시작
                </Link>
                <Link
                  href="/builder"
                  className="rounded-full border border-zinc-600 px-10 py-3.5 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  디자인 바로 시작
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
