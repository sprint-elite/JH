import { prisma } from "@/lib/db";
import { SITE_INFO } from "@/lib/site-info";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";

export type SiteSettingsData = {
  brandName: string;
  companyName: string;
  ceoName: string;
  businessNumber: string;
  mailOrderNumber: string;
  address: string;
  email: string;
  phone: string;
  hours: string;
  bankAccount: string;
  bankHolder: string;
  shippingFee: number;
  freeShippingThreshold: number;
};

const DEFAULTS: SiteSettingsData = {
  ...SITE_INFO,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSetting.findUnique({ where: { id: "default" } });
  if (!row || !row.data || typeof row.data !== "object") {
    return { ...DEFAULTS };
  }
  const data = row.data as Partial<SiteSettingsData>;
  return { ...DEFAULTS, ...data };
}

export async function saveSiteSettings(
  patch: Partial<SiteSettingsData>,
): Promise<SiteSettingsData> {
  const current = await getSiteSettings();
  const next: SiteSettingsData = {
    ...current,
    ...patch,
    shippingFee: Math.max(
      0,
      Math.round(Number(patch.shippingFee ?? current.shippingFee)),
    ),
    freeShippingThreshold: Math.max(
      0,
      Math.round(
        Number(patch.freeShippingThreshold ?? current.freeShippingThreshold),
      ),
    ),
  };

  await prisma.siteSetting.upsert({
    where: { id: "default" },
    create: { id: "default", data: next },
    update: { data: next },
  });

  return next;
}

/** 동기 폴백용 — 푸터 등에서 await 없이 쓸 때 SITE_INFO 유지 */
export { SITE_INFO };
