export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string | null {
  if (!email) return "이메일을 입력하세요.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "비밀번호를 입력하세요.";
  if (password.length < 8) return "비밀번호는 8자 이상 입력하세요.";
  return null;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "이름을 입력하세요.";
  if (trimmed.length < 2) return "이름은 2자 이상 입력하세요.";
  return null;
}

export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 11) {
    return "연락처 형식을 확인해 주세요.";
  }
  return null;
}
