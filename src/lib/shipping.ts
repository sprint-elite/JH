import { getSiteSettings } from "@/lib/site-settings";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  resolveShippingFee as resolveShippingFeeBase,
} from "@/lib/pricing";

export async function getShippingConfig() {
  const settings = await getSiteSettings();
  return {
    shippingFee: settings.shippingFee ?? SHIPPING_FEE,
    freeShippingThreshold:
      settings.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD,
  };
}

/** 사이트 설정 기준 배송비 계산 */
export function resolveShippingFeeWithThreshold(
  merchandiseTotal: number,
  baseFee: number,
  freeThreshold: number,
): number {
  if (merchandiseTotal >= freeThreshold) return 0;
  return Math.max(0, baseFee);
}

export { resolveShippingFeeBase as resolveShippingFee };
