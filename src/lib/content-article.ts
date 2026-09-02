import type { ContentArticle, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { GUIDE_ARTICLES } from "@/lib/guide-articles";
import type {
  GuideArticle,
  GuideFaq,
  GuideSection,
} from "@/lib/guide-articles";

export type ContentArticleType = "GUIDE" | "IDEA";

export type ContentArticlePayload = {
  type: ContentArticleType;
  slug: string;
  title: string;
  subtitle: string;
  date: string;
  intro: string[];
  sections: GuideSection[];
  faq: GuideFaq[];
  coverImageUrl?: string | null;
  cardTag?: string | null;
  cardGradient?: string | null;
  sortOrder?: number;
};

export type HomeContentCard = {
  id: string;
  type: ContentArticleType;
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imageUrl: string | null;
  cardTag: string | null;
  gradient: string;
};

function asStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => String(x)).filter((s) => s.trim().length > 0);
}

function asSections(raw: unknown): GuideSection[] {
  if (!Array.isArray(raw)) return [];
  const out: GuideSection[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const title = String(r.title ?? "").trim();
    if (!title) continue;
    const body = asStringArray(r.body);
    const tips = asStringArray(r.tips);
    const products: { slug: string; caption?: string }[] = [];
    if (Array.isArray(r.products)) {
      for (const p of r.products) {
        if (!p || typeof p !== "object") continue;
        const pr = p as { slug?: unknown; caption?: unknown };
        const slug = String(pr.slug ?? "").trim();
        if (!slug) continue;
        products.push({
          slug,
          caption: typeof pr.caption === "string" ? pr.caption : undefined,
        });
      }
    }
    out.push({
      title,
      body,
      tipsTitle: typeof r.tipsTitle === "string" ? r.tipsTitle : undefined,
      tips: tips.length ? tips : undefined,
      productsTitle:
        typeof r.productsTitle === "string" ? r.productsTitle : undefined,
      products: products.length ? products : undefined,
    });
  }
  return out;
}

function asFaq(raw: unknown): GuideFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as { q?: unknown; a?: unknown };
      const q = String(r.q ?? "").trim();
      const a = String(r.a ?? "").trim();
      if (!q || !a) return null;
      return { q, a };
    })
    .filter((x): x is GuideFaq => x != null);
}

export function rowToArticle(row: ContentArticle): GuideArticle & {
  type: ContentArticleType;
  coverImageUrl: string | null;
  cardTag: string | null;
} {
  const type = row.type === "IDEA" ? "IDEA" : "GUIDE";
  return {
    type,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    date: row.publishedAt.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
    intro: asStringArray(row.introJson),
    sections: asSections(row.sectionsJson),
    faq: asFaq(row.faqJson),
    cardGradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
    coverImageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
  };
}

export function articlePath(type: ContentArticleType, slug: string) {
  return type === "IDEA" ? `/ideas/${slug}` : `/guides/${slug}`;
}

export async function fetchContentArticleBySlug(
  type: ContentArticleType,
  slug: string,
) {
  const row = await prisma.contentArticle.findFirst({
    where: { type, slug, isActive: true },
  });
  return row ? rowToArticle(row) : null;
}

export async function fetchHomeContentCards(
  type: ContentArticleType,
): Promise<HomeContentCard[]> {
  const rows = await prisma.contentArticle.findMany({
    where: { type, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    type,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    href: articlePath(type, row.slug),
    imageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
    gradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
  }));
}

/** 소개글 우측 추천 (현재 글 제외) */
export async function fetchRelatedIdeaCards(
  excludeSlug: string,
  take = 3,
): Promise<HomeContentCard[]> {
  const rows = await prisma.contentArticle.findMany({
    where: {
      type: "IDEA",
      isActive: true,
      slug: { not: excludeSlug },
    },
    orderBy: { sortOrder: "asc" },
    take,
  });
  return rows.map((row) => ({
    id: row.id,
    type: "IDEA" as const,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    href: articlePath("IDEA", row.slug),
    imageUrl: row.coverImageUrl,
    cardTag: row.cardTag,
    gradient: row.cardGradient ?? "from-zinc-100 to-stone-50",
  }));
}

export const DEFAULT_IDEA_ARTICLES: ContentArticlePayload[] = [
  {
    type: "IDEA",
    slug: "couple-ecobag",
    title: "커플 · 우정 단체티",
    subtitle: "이니셜 · 날짜 나염",
    date: "2026.08.20",
    coverImageUrl: "/images/idea1.png",
    cardGradient: "from-pink-200 to-rose-100",
    sortOrder: 0,
    intro: [
      "둘만의 문구·날짜·이니셜을 넣은 반팔티는 기념일·우정·커플 여행 선물로 꾸준히 사랑받는 아이템입니다. 시중에서 같은 디자인을 찾기 어렵고, 2장만 맞춰도 ‘우리만의 단체티’가 됩니다.",
      "대지나염에서는 같은 시안을 색만 다르게 맞추거나, 앞면은 공통 그래픽·뒷면은 각자 문구로 나눠 제작할 수 있습니다.",
    ],
    sections: [
      {
        title: "어떤 스타일이 잘 맞을까요?",
        body: [
          "데일리로 오래 입을 생각이면 17수·32수 라운드가 안정적입니다. 커플이 같은 상품을 고르면 거리에서도 세트감이 분명해집니다.",
          "페스티벌·여행용이라면 기능성 반팔이 편합니다. 처음이라면 ‘같은 상품 2장 + 컬러만 다르게’ 조합을 추천합니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag", caption: "17수 라운드" },
          { slug: "ecobag-round", caption: "기능성 반팔" },
          { slug: "ecobag-cross", caption: "32수 라운드" },
          { slug: "pouch-flat", caption: "맨투맨 세트" },
        ],
      },
    ],
    faq: [
      {
        q: "2장만 주문해도 되나요?",
        a: "네. 커스텀 단체티는 1장부터 제작할 수 있어 커플·우정용 소량 제작에 적합합니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "home-deco",
    title: "동아리 단체복",
    subtitle: "후드 · 맨투맨",
    date: "2026.08.18",
    coverImageUrl: "/images/idea2.png",
    cardGradient: "from-amber-200 to-orange-100",
    sortOrder: 1,
    intro: [
      "동아리 로고와 기수 문구를 넣은 후드·맨투맨은 신입 모집·MT·졸업 시즌마다 다시 찾는 아이템입니다. 한 번 시안을 저장해 두면 다음 학기도 날짜만 바꿔 재주문할 수 있어요.",
      "대지나염 후드티는 1장부터 가능해, 임원진 샘플 후 본 발주하기 좋습니다.",
    ],
    sections: [
      {
        title: "동아리에 맞는 아이템",
        body: [
          "겨울·MT는 특양면 후드, 봄가을은 라이트 맨투맨이 잘 맞습니다. 스태프·운영진은 후드집업으로 구분해 보세요.",
          "등판 큰 로고 + 가슴 작은 워드마크 조합이 가장 많이 나갑니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "pouch", caption: "특양면 후드" },
          { slug: "pouch-flat", caption: "라이트 맨투맨" },
          { slug: "pouch-cube", caption: "후드집업" },
        ],
      },
    ],
    faq: [
      {
        q: "기수를 나눠 주문할 수 있나요?",
        a: "같은 시안에 기수 문구만 다르게 저장해 각각 주문하면 됩니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "travel-essentials",
    title: "MT · 여행 단체티",
    subtitle: "기능성 반팔",
    date: "2026.08.16",
    coverImageUrl: "/images/idea3.png",
    cardGradient: "from-sky-200 to-blue-100",
    sortOrder: 2,
    intro: [
      "MT·워크샵·단체 여행에서는 목적지와 날짜가 들어간 기능성 반팔티가 실용과 인증샷을 한 번에 잡습니다. 같은 시안으로 맞추면 인원 파악에도 도움이 됩니다.",
    ],
    sections: [
      {
        title: "여행용 추천 구성",
        body: [
          "여름 야외는 흡한속건 쿨론, 실내·기념용은 17수 라운드가 무난합니다. 아동이 있으면 키즈 사이즈를 따로 잡으세요.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag-round", caption: "기능성 반팔" },
          { slug: "ecobag", caption: "17수 라운드" },
          { slug: "ecobag-mini", caption: "아동용" },
        ],
      },
    ],
    faq: [
      {
        q: "소량만 만들어도 되나요?",
        a: "네. 1장부터 제작 가능해 가족·커플 여행 기념용으로도 많이 주문합니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "pet-walk",
    title: "가족 · 키즈 단체티",
    subtitle: "아동 사이즈",
    date: "2026.08.14",
    coverImageUrl: "/images/idea4.png",
    cardGradient: "from-emerald-200 to-green-100",
    sortOrder: 3,
    intro: [
      "가족 나들이·어린이집·학원 행사에는 아동용 쿨론 라운드가 잘 맞습니다. 이름이나 짧은 슬로건만 넣어도 분실 방지와 소속감이 생깁니다.",
    ],
    sections: [
      {
        title: "키즈 단체티 고르기",
        body: [
          "활동량이 많으면 기능성 원단, 기념 촬영이면 17수 면이 포토에 잘 나옵니다. 성인 사이즈와 같은 시안으로 가족 세트를 맞출 수도 있어요.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag-mini", caption: "아동용 쿨론" },
          { slug: "ecobag", caption: "성인 라운드" },
          { slug: "ecobag-round", caption: "기능성" },
        ],
      },
    ],
    faq: [
      {
        q: "아동 사이즈 표가 있나요?",
        a: "상품 상세의 사이즈표를 참고하고, 애매하면 한 치수 업을 권장합니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "flea-market",
    title: "체육대회 · 축제",
    subtitle: "대량 나염",
    date: "2026.08.12",
    coverImageUrl: "/images/idea5.png",
    cardGradient: "from-stone-200 to-zinc-100",
    sortOrder: 4,
    intro: [
      "학교 체육대회와 지역 축제에서는 등판 큰 슬로건 반팔티가 현장 브랜딩을 담당합니다. 수량이 많을수록 나염 장당 단가가 내려갑니다.",
    ],
    sections: [
      {
        title: "행사 수량·용도 나누기",
        body: [
          "참가자 배포와 스태프용 수량을 나눠 주문하면 재고·정산이 명확해집니다. 배포용은 17수 라운드, 스태프는 카라티나 다른 색으로 구분하세요.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag", caption: "17수 라운드" },
          { slug: "ecobag-round", caption: "기능성" },
          { slug: "shopping-bag", caption: "스태프 카라티" },
        ],
      },
    ],
    faq: [
      {
        q: "대량 납기는 얼마나 보나요?",
        a: "보통 영업일 3~5일 출고를 목표로 합니다. 행사일이 정해져 있으면 여유를 두고 주문해 주세요.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "welcome-kit",
    title: "기업 유니폼 · 워크샵",
    subtitle: "로고 나염",
    date: "2026.08.10",
    coverImageUrl: "/images/idea6.png",
    cardGradient: "from-zinc-200 to-slate-100",
    sortOrder: 5,
    intro: [
      "입사자 웰컴 키트와 워크샵 단체티에 로고 반팔·카라티를 넣으면 첫인상이 브랜드 경험으로 바뀝니다. 샘플 후 기수에 맞춰 본 발주하기 좋습니다.",
    ],
    sections: [
      {
        title: "키트 구성 예시",
        body: [
          "가장 무난한 조합은 ‘17수 라운드(본 행사) + 카라티(현장·외부)’. 임원·파트너용은 폴로, 신입·대량은 라운드로 2-티어 구성도 많이 씁니다.",
        ],
        productsTitle: "추천 구성",
        products: [
          { slug: "ecobag", caption: "라운드 본 행사" },
          { slug: "shopping-bag-wide", caption: "20수 카라티" },
          { slug: "shopping-bag-fold", caption: "폴로" },
        ],
      },
    ],
    faq: [
      {
        q: "세금계산서·대량 견적이 가능한가요?",
        a: "사업자 주문·대량 견적은 1:1 문의로 수량과 납기를 남겨 주시면 안내드립니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "fan-meeting",
    title: "팬미팅 슬로건티",
    subtitle: "응원 · 생일카페",
    date: "2026.08.08",
    coverImageUrl: "/images/idea7.png",
    cardGradient: "from-rose-100 to-orange-50",
    sortOrder: 6,
    intro: [
      "슬로건·멤버 컬러·날짜를 넣은 반팔·후드는 팬미팅·콘서트·생일 카페 현장 배포와 소량 MD에 잘 맞습니다. 공식 이미지는 권한이 있는 범위에서만 사용하세요.",
    ],
    sections: [
      {
        title: "배포용 vs 판매용",
        body: [
          "현장 배포는 17수 라운드, 부스 판매 MD는 후드·맨투맨처럼 ‘갖고 싶은 아이템’을 메인으로 두는 구성이 객단가에 유리합니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "ecobag", caption: "배포 라운드" },
          { slug: "pouch-flat", caption: "맨투맨" },
          { slug: "pouch", caption: "후드" },
        ],
      },
    ],
    faq: [
      {
        q: "개인이 소량만 만들어도 되나요?",
        a: "네. 1장부터 가능해 생일 카페·개인 덕질 제작에 많이 쓰입니다.",
      },
    ],
  },
  {
    type: "IDEA",
    slug: "cafe-opening",
    title: "카페 스태프티",
    subtitle: "카라티 유니폼",
    date: "2026.08.06",
    coverImageUrl: "/images/idea8.png",
    cardGradient: "from-yellow-100 to-amber-50",
    sortOrder: 7,
    intro: [
      "오픈 기념 스태프 유니폼으로 카라티에 상호만 넣어도 매장 톤이 살아납니다. 오픈 전 소량으로 사이즈를 본 뒤 인원에 맞춰 추가하세요.",
    ],
    sections: [
      {
        title: "카페 추천 구성",
        body: [
          "홀은 쿨론 카라티, 주방은 17수 라운드, 겨울은 후드집업. 직원용과 아르바이트용 색을 다르게 두면 구분이 쉽습니다.",
        ],
        productsTitle: "추천 상품",
        products: [
          { slug: "shopping-bag", caption: "쿨론 카라티" },
          { slug: "ecobag", caption: "라운드" },
          { slug: "pouch-cube", caption: "후드집업" },
        ],
      },
    ],
    faq: [
      {
        q: "로고 파일만 있어도 되나요?",
        a: "네. 로고만 빌더에 올려도 충분합니다. 배경 제거가 필요하면 주문 메모에 남겨 주세요.",
      },
    ],
  },
];

export function defaultGuidePayloads(): ContentArticlePayload[] {
  return GUIDE_ARTICLES.map((a, i) => ({
    type: "GUIDE" as const,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle,
    date: a.date,
    intro: a.intro,
    sections: a.sections,
    faq: a.faq,
    cardGradient: a.cardGradient,
    coverImageUrl: null,
    cardTag: null,
    sortOrder: i,
  }));
}

export function toPrismaCreateData(
  payload: ContentArticlePayload,
): Prisma.ContentArticleCreateInput {
  const publishedAt = payload.date
    ? new Date(payload.date.replace(/\./g, "-"))
    : new Date();
  return {
    type: payload.type,
    slug: payload.slug,
    title: payload.title,
    subtitle: payload.subtitle,
    coverImageUrl: payload.coverImageUrl ?? null,
    cardTag: payload.cardTag ?? null,
    cardGradient: payload.cardGradient ?? null,
    introJson: payload.intro,
    sectionsJson: payload.sections,
    faqJson: payload.faq,
    publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
    sortOrder: payload.sortOrder ?? 0,
    isActive: true,
  };
}
