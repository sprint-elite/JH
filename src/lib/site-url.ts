/** 절대 URL 기준 (OG, sitemap 등) */
export function getSiteUrl(): string {
  const raw =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
