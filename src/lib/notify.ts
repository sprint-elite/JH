/** 주문/배송 알림 스텁 — SMTP 연동 전 서버 로그 */

export type NotifyPayload = {
  type:
    | "ORDER_PAID"
    | "ORDER_SHIPPED"
    | "ORDER_CANCELLED"
    | "PASSWORD_RESET"
    | "INQUIRY";
  toEmail: string;
  subject: string;
  body: string;
  meta?: Record<string, unknown>;
};

export async function notify(payload: NotifyPayload): Promise<void> {
  console.info("[notify]", payload.type, payload.toEmail, payload.subject);
  if (payload.meta) {
    console.info("[notify:meta]", JSON.stringify(payload.meta));
  }
  // 추후: Resend / SES / SMTP
}
