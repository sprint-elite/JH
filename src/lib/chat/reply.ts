import { prisma } from "@/lib/db";
import { formatKRW } from "@/lib/pricing";
import { searchProducts } from "@/lib/product-search";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import { PAYMENT_STATUS_LABELS, type PaymentStatus } from "@/lib/payment-status";
import { SUPPORT_FAQS } from "@/lib/support-faq";
import type { SiteSettingsData } from "@/lib/site-settings";
import type { ChatLink, ChatPending, ChatReply } from "@/lib/chat/types";
import type { OrderStatus } from "@/types";
import {
  formatOrderLookupText,
  lookupOrderByNumberAndEmail,
} from "@/lib/order-lookup";
import { normalizeEmail, validateEmail } from "@/lib/auth-validation";

type ChatInput = {
  message: string;
  pending: ChatPending;
  userId: string | null;
  settings: SiteSettingsData;
};

type Intent =
  | "handoff"
  | "order"
  | "quote"
  | "qty"
  | "leadtime"
  | "shipping_fee"
  | "returns"
  | "hours"
  | "faq"
  | "product"
  | "builder"
  | "greeting"
  | "thanks"
  | "unknown";

const COMPACT = /\s+/g;

function compact(text: string) {
  return text.replace(COMPACT, "").toLowerCase();
}

function hasAny(hay: string, needles: string[]) {
  return needles.some((n) => hay.includes(n.replace(COMPACT, "").toLowerCase()) || hay.includes(n));
}

function extractQuantity(message: string): number | null {
  const withUnit = message.match(/(\d{1,4})\s*(장|벌|개|매)(?=$|[\s,.?!])/);
  const onlyNum = message.trim().match(/^(\d{1,4})$/);
  const raw = withUnit?.[1] ?? onlyNum?.[1];
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 9999) return null;
  return n;
}

function extractOrderNumber(message: string): string | null {
  const m = message.match(/JH-\d{4}-\d{3,}/i);
  return m ? m[0].toUpperCase() : null;
}

function extractEmail(message: string): string | null {
  const m = message.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  if (!m) return null;
  const email = normalizeEmail(m[0]);
  return validateEmail(email) ? null : email;
}

function extractProductQuery(message: string, loose = false): string | null {
  const hints = [
    "반팔",
    "티셔츠",
    "카라",
    "폴로",
    "후드",
    "집업",
    "맨투맨",
    "긴팔",
    "기능성",
    "조끼",
    "점퍼",
    "야구",
    "아동",
  ];
  const hit = hints.find((h) => message.includes(h));
  if (hit) return hit;
  if (!loose) return null;
  const cleaned = message
    .replace(
      /최소|몇\s*장|부터|견적|가격|얼마|단가|수량|주문|배송|문의|주세요|알려|싶어|하고|요|\d+\s*장/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 2 && cleaned.length <= 40) return cleaned;
  return null;
}

function isBusinessOpen(hours: string, now = new Date()): boolean | null {
  const kst = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = kst.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(kst.find((p) => p.type === "hour")?.value ?? NaN);
  const minute = Number(kst.find((p) => p.type === "minute")?.value ?? NaN);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (weekday === "Sat" || weekday === "Sun") return false;

  const span = hours.match(/(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/);
  if (!span) return null;
  const start = Number(span[1]) * 60 + Number(span[2]);
  const end = Number(span[3]) * 60 + Number(span[4]);
  const cur = hour * 60 + minute;
  return cur >= start && cur < end;
}

function inquiryLink(subject?: string) {
  const qs = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return { href: `/inquiry${qs}`, label: "1:1 문의하기" };
}

function handoffReply(
  settings: SiteSettingsData,
  reason: string,
  extraLinks: ChatLink[] = [],
): ChatReply {
  const open = isBusinessOpen(settings.hours);
  const phone = settings.phone;
  const timeLine =
    open === true
      ? `지금 상담 가능 시간입니다. ${phone}으로 전화하시거나 1:1 문의를 남겨 주세요.`
      : `전화 상담은 ${settings.hours}에 가능해요. 지금은 1:1 문의로 남겨 주시면 확인 후 답변드릴게요.`;

  return {
    text: `${reason}\n\n${timeLine}`,
    links: [
      inquiryLink("챗봇 상담 문의"),
      { href: `tel:${phone.replace(/[^0-9+]/g, "")}`, label: `전화 ${phone}` },
      ...extraLinks,
    ],
    quickReplies: ["단체 견적 받고 싶어요", "내 주문 조회"],
    pending: null,
  };
}

function classify(message: string): Intent {
  const c = compact(message);

  if (
    hasAny(c, [
      "상담원",
      "1:1",
      "1대1",
      "문의하기",
      "전화문의",
      "통화",
      "상담연결",
    ]) ||
    c === "문의" ||
    c.includes("전화번")
  ) {
    return "handoff";
  }

  if (hasAny(c, ["당일", "오늘받", "오늘출", "내일받", "해외", "퀵배", "특급"])) {
    return "unknown";
  }

  if (hasAny(c, ["안녕", "hello", "hi", "헬로"]) && c.length <= 12) {
    return "greeting";
  }
  if (hasAny(c, ["감사", "고마", "고맙", "땡큐"])) return "thanks";

  if (extractQuantity(message) && extractProductQuery(message)) return "quote";

  if (hasAny(c, ["영업", "몇시", "고객센터", "운영시간", "휴무"])) return "hours";

  if (hasAny(c, ["교환", "반품", "환불", "청약"])) return "returns";

  if (hasAny(c, ["배송비", "택배비", "무료배송"])) return "shipping_fee";

  if (hasAny(c, ["송장", "운송장", "내주문", "주문조회", "주문번호", "어디까지"])) {
    return "order";
  }
  if (c.includes("주문") && hasAny(c, ["확인", "상태", "조회", "배송"])) return "order";

  if (hasAny(c, ["납기", "제작기간", "얼마나걸려", "며칠", "출고"])) return "leadtime";
  if (c.includes("배송") && hasAny(c, ["얼마나", "기간", "언제"])) return "leadtime";

  if (hasAny(c, ["견적", "단가", "가격", "비용"])) return "quote";
  if (c.includes("얼마") && !c.includes("얼마나")) return "quote";

  if (hasAny(c, ["최소", "몇장", "몇장부터", "최소수량"])) return "qty";
  if (c.includes("1장") && hasAny(c, ["부터", "최소", "가능"])) return "qty";

  if (hasAny(c, ["빌더", "디자인하기", "로고넣", "시안"])) return "builder";

  const faqHit = SUPPORT_FAQS.find((f) =>
    f.keywords.some((k) => compact(message).includes(compact(k))),
  );
  if (faqHit) return "faq";

  if (
    hasAny(c, [
      "반팔",
      "카라",
      "후드",
      "맨투맨",
      "티셔츠",
      "점퍼",
      "상품",
      "추천",
    ])
  ) {
    return "product";
  }

  return "unknown";
}

function matchFaq(message: string) {
  const c = compact(message);
  return (
    SUPPORT_FAQS.find((f) => f.keywords.some((k) => c.includes(compact(k)))) ??
    SUPPORT_FAQS.find((f) => c.includes(compact(f.q.slice(0, 8)))) ??
    null
  );
}

async function findProducts(query: string) {
  return searchProducts(query, 4);
}

function formatProductLine(
  p: Awaited<ReturnType<typeof searchProducts>>[number],
  quantity?: number,
) {
  const qty = Math.max(p.minQuantity, quantity ?? p.minQuantity);
  const approx = p.basePrice * qty;
  const extra =
    quantity && quantity < p.minQuantity
      ? ` (최소 ${p.minQuantity}장)`
      : "";
  return `· ${p.name} — ${qty}장 기준 약 ${formatKRW(approx)}${extra}`;
}

async function replyQuote(
  message: string,
  pending: ChatPending,
  settings: SiteSettingsData,
): Promise<ChatReply> {
  const quantity = extractQuantity(message) ?? pending?.quantity ?? null;
  const productQuery =
    extractProductQuery(message, pending?.topic === "quote") ??
    pending?.productQuery ??
    null;

  if (!productQuery && !quantity) {
    return {
      text: "대략 견적은 품목과 수량만 알려주시면 바로 잡아 드려요. 예: 반팔 30장, 후드 50장.\n사이즈·인쇄면에 따라 달라질 수 있어, 확정 금액은 빌더나 1:1 문의로 확인해 주세요.",
      links: [{ href: "/products/list", label: "상품 보러가기" }, inquiryLink("단체 견적 문의")],
      quickReplies: ["반팔 30장", "카라 20장", "후드 50장"],
      pending: { topic: "quote" },
    };
  }

  if (!productQuery) {
    return {
      text: `${quantity}장 기준이군요. 반팔·카라·후드 중 어떤 상품인지 알려 주세요.`,
      links: [{ href: "/products/list", label: "상품 보러가기" }],
      quickReplies: ["반팔", "카라티", "후드"],
      pending: { topic: "quote", quantity: quantity ?? undefined },
    };
  }

  const products = await findProducts(productQuery);
  if (products.length === 0) {
    if (pending?.topic === "quote" && pending.productQuery) {
      return handoffReply(
        settings,
        "해당 상품을 찾지 못했어요. 품목을 특정하기 어려워 상담으로 이어가는 게 정확합니다.",
      );
    }
    return {
      text: `"${productQuery}"로 상품을 찾지 못했어요. 반팔 / 카라 / 후드처럼 품목을 다시 알려 주시겠어요?`,
      links: [{ href: "/products/list", label: "전체 상품 보기" }],
      quickReplies: ["반팔 30장", "카라 20장", "후드 50장"],
      pending: { topic: "quote", quantity: quantity ?? undefined },
    };
  }

  const lines = products.map((p) => formatProductLine(p, quantity ?? undefined));
  const first = products[0];
  const qtyNote = quantity
    ? `${quantity}장 기준`
    : `최소 ${first.minQuantity}장부터`;

  return {
    text: `${qtyNote} 기본가 기준 대략 금액입니다. 옵션·인쇄면에 따라 달라질 수 있어요.\n\n${lines.join("\n")}\n\n정확한 시안·단가는 상품에서 디자인한 뒤 주문하거나, 1:1 문의로 남겨 주세요.`,
    links: [
      { href: `/products/${first.slug}`, label: `${first.name} 보기` },
      inquiryLink("단체 견적 문의"),
    ],
    quickReplies: ["최소 몇 장부터요?", "제작 기간이 궁금해요", "1:1 문의하기"],
    pending: null,
  };
}

async function replyQty(message: string, settings: SiteSettingsData): Promise<ChatReply> {
  const productQuery = extractProductQuery(message);
  if (productQuery) {
    const products = await findProducts(productQuery);
    if (products.length > 0) {
      const lines = products.map(
        (p) => `· ${p.name} — 최소 ${p.minQuantity}장, 기본가 ${formatKRW(p.basePrice)}`,
      );
      return {
        text: `${lines.join("\n")}\n\n수량이 많을수록 장당 단가가 내려가는 상품이 있어요.`,
        links: [{ href: `/products/${products[0].slug}`, label: `${products[0].name} 보기` }],
        quickReplies: ["단체 견적 받고 싶어요", "제작 기간이 궁금해요"],
        pending: null,
      };
    }
  }

  const rows = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
    take: 6,
    select: { name: true, slug: true, minQuantity: true, basePrice: true },
  });

  if (rows.length === 0) {
    return handoffReply(settings, "지금은 상품 최소 수량을 바로 안내하기 어려워요.");
  }

  const lines = rows.map((p) => `· ${p.name} — 최소 ${p.minQuantity}장부터`);
  return {
    text: `상품마다 최소 수량이 달라요.\n\n${lines.join("\n")}\n\n원하는 품목을 알려주시면 그 상품 기준으로 다시 안내할게요.`,
    links: [{ href: "/products/list", label: "상품 보러가기" }],
    quickReplies: ["반팔 최소 수량", "후드 최소 수량", "단체 견적 받고 싶어요"],
    pending: { topic: "quote" },
  };
}

async function replyGuestOrder(
  message: string,
  pending: ChatPending,
): Promise<ChatReply> {
  const orderNumber =
    extractOrderNumber(message) ?? pending?.orderNumber ?? null;
  const email = extractEmail(message) ?? pending?.email ?? null;

  if (orderNumber && email) {
    const row = await lookupOrderByNumberAndEmail(orderNumber, email);
    if (!row) {
      return {
        text: `${orderNumber} 주문을 해당 이메일로 찾지 못했어요. 주문번호와 주문 시 이메일을 다시 확인해 주세요.`,
        links: [
          { href: "/orders", label: "비회원 주문조회" },
          inquiryLink("주문 조회 문의"),
        ],
        quickReplies: ["1:1 문의하기", "단체 견적 받고 싶어요"],
        pending: null,
      };
    }
    return {
      text: formatOrderLookupText(row),
      links: [{ href: "/orders", label: "주문조회 페이지" }],
      quickReplies: ["1:1 문의하기", "제작 기간이 궁금해요"],
      pending: null,
    };
  }

  if (orderNumber && !email) {
    return {
      text: `${orderNumber} 주문이군요. 비회원은 주문할 때 쓰신 이메일을 알려 주셔야 조회할 수 있어요.`,
      links: [{ href: "/orders", label: "비회원 주문조회" }],
      quickReplies: ["1:1 문의하기"],
      pending: { topic: "order", orderNumber },
    };
  }

  if (email && !orderNumber) {
    return {
      text: "이메일은 확인했어요. 주문번호(JH-연도-번호)를 보내 주시면 상태를 안내할게요.",
      links: [{ href: "/orders", label: "비회원 주문조회" }],
      quickReplies: ["1:1 문의하기"],
      pending: { topic: "order", email },
    };
  }

  return {
    text: "비회원 주문은 주문번호(JH-연도-번호)와 주문 시 이메일로 조회할 수 있어요. 채팅에 둘 다 보내 주시거나 주문조회 페이지를 이용해 주세요.",
    links: [
      { href: "/orders", label: "비회원 주문조회" },
      { href: "/login?next=/mypage", label: "로그인하기" },
    ],
    quickReplies: ["1:1 문의하기", "단체 견적 받고 싶어요"],
    pending: { topic: "order" },
  };
}

async function replyOrder(
  message: string,
  userId: string | null,
  pending: ChatPending,
): Promise<ChatReply> {
  if (!userId) {
    return replyGuestOrder(message, pending);
  }

  const orderNumber = extractOrderNumber(message);
  if (orderNumber) {
    const row = await prisma.order.findFirst({
      where: { userId, orderNumber },
      include: { product: { select: { name: true } } },
    });
    if (!row) {
      const email = extractEmail(message) ?? pending?.email ?? null;
      if (email) {
        const pub = await lookupOrderByNumberAndEmail(orderNumber, email);
        if (pub) {
          return {
            text: formatOrderLookupText(pub),
            links: [{ href: "/orders", label: "주문조회 페이지" }],
            quickReplies: ["1:1 문의하기", "제작 기간이 궁금해요"],
            pending: null,
          };
        }
      }
      return {
        text: `${orderNumber} 주문을 이 계정에서 찾지 못했어요. 비회원으로 주문하셨다면 주문 시 이메일을 함께 보내 주세요.`,
        links: [
          inquiryLink("주문 조회 문의"),
          { href: "/orders", label: "비회원 주문조회" },
          { href: "/mypage", label: "마이페이지" },
        ],
        quickReplies: ["내 주문 조회", "1:1 문의하기"],
        pending: { topic: "order", orderNumber },
      };
    }
    const ship = row.trackingNumber
      ? `\n송장번호: ${row.trackingNumber}`
      : "\n송장번호는 아직 없어요. 출고되면 주문 상세에 표시됩니다.";
    return {
      text: `${row.orderNumber}\n${row.product.name} · ${row.quantity}장\n진행: ${ORDER_STATUS_LABELS[row.status as OrderStatus] ?? row.status}\n결제: ${PAYMENT_STATUS_LABELS[row.paymentStatus as PaymentStatus] ?? row.paymentStatus}${ship}`,
      links: [{ href: `/mypage/orders/${row.id}`, label: "주문 상세 보기" }],
      quickReplies: ["1:1 문의하기", "제작 기간이 궁금해요"],
      pending: null,
    };
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 3,
    include: { product: { select: { name: true } } },
  });

  if (orders.length === 0) {
    return {
      text: "이 계정으로 조회되는 주문이 아직 없어요. 비회원으로 주문하셨다면 주문번호와 이메일을 보내 주시거나 주문조회 페이지를 이용해 주세요.",
      links: [
        { href: "/orders", label: "비회원 주문조회" },
        inquiryLink("주문 조회 문의"),
        { href: "/products/list", label: "상품 보러가기" },
      ],
      quickReplies: ["단체 견적 받고 싶어요", "1:1 문의하기"],
      pending: null,
    };
  }

  const lines = orders.map((o) => {
    const st = ORDER_STATUS_LABELS[o.status as OrderStatus] ?? o.status;
    const track = o.trackingNumber ? ` · 송장 ${o.trackingNumber}` : "";
    return `· ${o.orderNumber} — ${o.product.name} (${st})${track}`;
  });

  return {
    text: `최근 주문입니다.\n\n${lines.join("\n")}\n\n특정 주문을 보시려면 주문번호(JH-연도-번호)를 보내 주세요.`,
    links: [{ href: "/mypage", label: "마이페이지" }],
    quickReplies: ["1:1 문의하기", "제작 기간이 궁금해요"],
    pending: null,
  };
}

async function replyProduct(message: string): Promise<ChatReply> {
  const q = extractProductQuery(message) ?? message;
  const products = await findProducts(q);
  if (products.length === 0) {
    return {
      text: "해당하는 상품을 바로 찾지 못했어요. 반팔 / 카라 / 후드로 다시 알려 주시거나 목록에서 골라 주세요.",
      links: [{ href: "/products/list", label: "전체 상품 보기" }],
      quickReplies: ["반팔티", "카라티", "후드"],
      pending: { topic: "quote" },
    };
  }
  const lines = products.map(
    (p) => `· ${p.name} — ${formatKRW(p.basePrice)}~ · 최소 ${p.minQuantity}장`,
  );
  return {
    text: `${lines.join("\n")}\n\n견적이 필요하면 수량과 함께 보내 주세요. 예: 후드 50장`,
    links: [
      { href: `/products/${products[0].slug}`, label: `${products[0].name} 보기` },
      { href: "/products/list", label: "더 보기" },
    ],
    quickReplies: ["단체 견적 받고 싶어요", "최소 몇 장부터요?"],
    pending: null,
  };
}

export function parseChatPending(raw: unknown): ChatPending {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.topic !== "quote" && o.topic !== "order") return null;
  const quantity = typeof o.quantity === "number" && o.quantity > 0 ? o.quantity : undefined;
  const productQuery =
    typeof o.productQuery === "string" && o.productQuery.trim()
      ? o.productQuery.trim().slice(0, 40)
      : undefined;
  const orderNumber =
    typeof o.orderNumber === "string" && /^JH-\d{4}-\d{3,}$/i.test(o.orderNumber.trim())
      ? o.orderNumber.trim().toUpperCase()
      : undefined;
  const emailRaw =
    typeof o.email === "string" ? normalizeEmail(o.email) : "";
  const email = emailRaw && !validateEmail(emailRaw) ? emailRaw : undefined;
  return { topic: o.topic, quantity, productQuery, orderNumber, email };
}

export async function answerChat(input: ChatInput): Promise<ChatReply> {
  const { message, pending, userId, settings } = input;
  const intent = classify(message);
  const followUp =
    pending &&
    (pending.topic === "quote" || pending.topic === "order") &&
    intent !== "handoff" &&
    intent !== "returns" &&
    intent !== "hours" &&
    intent !== "greeting";

  if (intent === "handoff") {
    return handoffReply(
      settings,
      "상담원 연결이 필요하시면 전화 또는 1:1 문의를 이용해 주세요. 챗봇에 적어 주신 내용은 문의 작성 시 함께 적어 주시면 더 빨라요.",
    );
  }

  if (intent === "greeting") {
    return {
      text: `안녕하세요! ${settings.brandName}입니다.\n최소 수량, 대략 견적, 주문 조회, 배송·교환 안내를 도와드릴게요.`,
      links: [{ href: "/faq", label: "FAQ 보기" }],
      quickReplies: ["최소 몇 장부터요?", "단체 견적 받고 싶어요", "내 주문 조회"],
      pending: null,
    };
  }

  if (intent === "thanks") {
    return {
      text: "도움이 되었다니 다행이에요. 다른 궁금한 점도 편하게 물어보세요.",
      links: [],
      quickReplies: ["단체 견적 받고 싶어요", "내 주문 조회"],
      pending: null,
    };
  }

  if (followUp && pending?.topic === "order" && (intent === "unknown" || intent === "order")) {
    return replyOrder(message, userId, pending);
  }
  if (followUp && pending?.topic === "quote" && (intent === "unknown" || intent === "quote" || intent === "qty" || intent === "product")) {
    return replyQuote(message, pending, settings);
  }

  if (intent === "order") return replyOrder(message, userId, pending);
  if (intent === "quote") return replyQuote(message, pending, settings);
  if (intent === "qty") return replyQty(message, settings);

  if (intent === "leadtime") {
    const faq = SUPPORT_FAQS.find((f) => f.q.includes("배송은"));
    return {
      text: `${faq?.a ?? "평균 제작·출고는 영업일 기준 3~5일 정도입니다."}\n커스텀은 시안 확정 후에 제작이 시작돼요. 급하신 일정은 상담으로 맞춰 볼게요.`,
      links: [{ href: "/faq", label: "FAQ 보기" }, inquiryLink("납기 문의")],
      quickReplies: ["단체 견적 받고 싶어요", "1:1 문의하기"],
      pending: null,
    };
  }

  if (intent === "shipping_fee") {
    const fee = formatKRW(settings.shippingFee);
    const free = formatKRW(settings.freeShippingThreshold);
    return {
      text: `기본 배송비는 ${fee}이며, 상품 합계 ${free} 이상이면 무료 배송입니다. 도서산간은 추가될 수 있어요.`,
      links: [{ href: "/faq", label: "FAQ 보기" }],
      quickReplies: ["내 주문 조회", "단체 견적 받고 싶어요"],
      pending: null,
    };
  }

  if (intent === "returns") {
    const faq = SUPPORT_FAQS.find((f) => f.q.includes("교환"));
    return {
      text: `${faq?.a ?? ""}\n불량·오배송은 사진과 함께 문의해 주시면 확인 후 도와드려요.`,
      links: [
        { href: "/returns", label: "교환·반품 안내" },
        { href: "/mypage/returns", label: "교환·반품 신청" },
        inquiryLink("교환·반품 문의"),
      ],
      quickReplies: ["1:1 문의하기", "내 주문 조회"],
      pending: null,
    };
  }

  if (intent === "hours") {
    const open = isBusinessOpen(settings.hours);
    const nowLabel =
      open === true ? "지금은 상담 가능 시간입니다." : "지금은 상담 시간이 아닐 수 있어요.";
    return {
      text: `${nowLabel}\n고객센터 ${settings.phone}\n${settings.hours}\n이메일 ${settings.email}`,
      links: [
        { href: `tel:${settings.phone.replace(/[^0-9+]/g, "")}`, label: `전화 ${settings.phone}` },
        inquiryLink("전화 상담 문의"),
      ],
      quickReplies: ["1:1 문의하기", "내 주문 조회"],
      pending: null,
    };
  }

  if (intent === "builder") {
    return {
      text: "로고·문구는 빌더에서 올리고, 시안이 없으면 빌더의 AI 디자인 도우미로 간단히 만들 수 있어요.",
      links: [{ href: "/builder", label: "빌더 열기" }, { href: "/products/list", label: "상품 고르기" }],
      quickReplies: ["단체 견적 받고 싶어요", "최소 몇 장부터요?"],
      pending: null,
    };
  }

  if (intent === "faq") {
    const faq = matchFaq(message);
    if (faq) {
      const links: ChatLink[] = [{ href: "/faq", label: "FAQ 보기" }];
      if (faq.q.includes("비회원")) {
        links.push({ href: "/orders", label: "비회원 주문조회" });
      } else if (faq.q.includes("송장") || faq.q.includes("회원 정보")) {
        links.push({ href: "/mypage", label: "마이페이지" });
      }
      if (faq.q.includes("교환")) {
        links.push({ href: "/returns", label: "교환·반품 안내" });
      }
      return {
        text: faq.a,
        links,
        quickReplies: ["내 주문 조회", "1:1 문의하기"],
        pending: null,
      };
    }
  }

  if (intent === "product") return replyProduct(message);

  return handoffReply(
    settings,
    "이 내용은 제가 상품·주문 정보만으로는 정확히 답하기 어려워요. 추측해서 안내드리지 않고, 상담으로 연결해 드릴게요.",
  );
}
