export type AddressDto = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export function toAddressDto(row: {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  address1: string;
  address2: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AddressDto {
  return {
    id: row.id,
    label: row.label,
    recipientName: row.recipientName,
    phone: row.phone,
    zipCode: row.zipCode,
    address1: row.address1,
    address2: row.address2,
    isDefault: row.isDefault,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function validateAddressInput(body: {
  label?: string;
  recipientName?: string;
  phone?: string;
  zipCode?: string;
  address1?: string;
  address2?: string | null;
}): string | null {
  if (!body.recipientName?.trim()) return "받는 분 성함을 입력해 주세요.";
  if (!body.phone?.trim()) return "연락처를 입력해 주세요.";
  const digits = body.phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) {
    return "연락처 형식을 확인해 주세요.";
  }
  if (!body.zipCode?.trim()) return "우편번호를 입력해 주세요.";
  if (!body.address1?.trim()) return "주소를 입력해 주세요.";
  return null;
}
