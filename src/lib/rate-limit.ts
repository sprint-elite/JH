/** 단순 IP 기반 인메모리 rate limit (프로세스 단위) */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

function throwRateLimit(retryAfterSec: number): never {
  const err = new Error(
    `요청이 너무 많습니다. ${retryAfterSec}초 후 다시 시도해 주세요.`,
  ) as Error & { status: number };
  err.status = 429;
  throw err;
}

/** 로그인·가입 등 인증 엔드포인트용 */
export function assertAuthRateLimit(request: Request, action: string) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`auth:${action}:${ip}`, 20, 15 * 60 * 1000);
  if (!result.ok) throwRateLimit(result.retryAfterSec);
}

/** 주문·결제 등 API용 */
export function assertApiRateLimit(
  request: Request,
  action: string,
  limit = 40,
  windowMs = 15 * 60 * 1000,
) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`api:${action}:${ip}`, limit, windowMs);
  if (!result.ok) throwRateLimit(result.retryAfterSec);
}
