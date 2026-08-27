/** 주문 시 고객이 입력하는 배송·연락 정보 */

export type OrderShippingInput = {
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingZip?: string;
  notes?: string;
};

export function normalizeShippingInput(
  raw: Partial<OrderShippingInput> | null | undefined,
): {
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingZip: string | null;
  notes: string | null;
} {
  const shippingName = raw?.shippingName?.trim() || null;
  const shippingPhone = raw?.shippingPhone?.trim() || null;
  const shippingAddress = raw?.shippingAddress?.trim() || null;
  const shippingZip = raw?.shippingZip?.trim() || null;
  const notes = raw?.notes?.trim() || null;
  return {
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingZip,
    notes,
  };
}

export function validateShippingInput(raw: Partial<OrderShippingInput>): string | null {
  const name = raw.shippingName?.trim() ?? "";
  const phone = raw.shippingPhone?.trim() ?? "";
  const address = raw.shippingAddress?.trim() ?? "";

  if (!name) return "고객명을 입력해 주세요.";
  if (!phone) return "연락처를 입력해 주세요.";
  if (!address) return "배송 주소를 입력해 주세요.";
  return null;
}
