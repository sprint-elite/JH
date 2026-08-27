/**
 * 토스페이먼츠 테스트/라이브 설정.
 * 신청 전에는 문서용 테스트 키로 연동 가능합니다.
 * @see https://docs.tosspayments.com/reference/using-api/api-keys
 */

/** 문서용 주문서형(위젯) 테스트 키 — 상점 발급 전 체험용 */
const DOCS_WIDGET_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const DOCS_WIDGET_SECRET_KEY = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6";

const TOSS_API_BASE = "https://api.tosspayments.com";

export function getTossClientKey(): string {
  return (
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY?.trim() || DOCS_WIDGET_CLIENT_KEY
  );
}

export function getTossSecretKey(): string {
  return process.env.TOSS_SECRET_KEY?.trim() || DOCS_WIDGET_SECRET_KEY;
}

export function isTossTestMode(): boolean {
  return getTossClientKey().startsWith("test_");
}

function authHeader(secretKey: string): string {
  const encoded = Buffer.from(`${secretKey}:`, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

/** 토스 orderId 규칙: 6~64자, 영문/숫자/-/_ */
export function toTossOrderId(paymentId: string): string {
  const id = paymentId.replace(/[^a-zA-Z0-9-_]/g, "");
  if (id.length >= 6 && id.length <= 64) return id;
  return `pay_${id}`.slice(0, 64);
}

export type TossConfirmResult = {
  paymentKey: string;
  orderId: string;
  status: string;
  method?: string;
  totalAmount: number;
  approvedAt?: string;
  raw: unknown;
};

export async function confirmTossPayment(input: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<TossConfirmResult> {
  const res = await fetch(`${TOSS_API_BASE}/v1/payments/confirm`, {
    method: "POST",
    headers: {
      Authorization: authHeader(getTossSecretKey()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      amount: input.amount,
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const message =
      typeof data.message === "string"
        ? data.message
        : "토스 결제 승인에 실패했습니다.";
    const code = typeof data.code === "string" ? data.code : "TOSS_ERROR";
    const err = new Error(message) as Error & { code?: string; status?: number };
    err.code = code;
    err.status = res.status;
    throw err;
  }

  return {
    paymentKey: String(data.paymentKey ?? input.paymentKey),
    orderId: String(data.orderId ?? input.orderId),
    status: String(data.status ?? ""),
    method: typeof data.method === "string" ? data.method : undefined,
    totalAmount: Number(data.totalAmount ?? input.amount),
    approvedAt:
      typeof data.approvedAt === "string" ? data.approvedAt : undefined,
    raw: data,
  };
}

export function mapTossMethodToPaymentMethod(
  method?: string,
): "CARD" | "BANK_TRANSFER" | "VIRTUAL_ACCOUNT" {
  if (!method) return "CARD";
  if (method.includes("가상") || method === "가상계좌") return "VIRTUAL_ACCOUNT";
  if (method.includes("계좌") || method === "계좌이체") return "BANK_TRANSFER";
  return "CARD";
}
