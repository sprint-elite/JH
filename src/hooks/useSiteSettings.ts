"use client";

import { useEffect, useState } from "react";
import { SITE_INFO } from "@/lib/site-info";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/pricing";
import type { SiteSettingsData } from "@/lib/site-settings";

const FALLBACK: SiteSettingsData = {
  ...SITE_INFO,
  shippingFee: SHIPPING_FEE,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
};

let cached: SiteSettingsData | null = null;

export function useSiteSettings(): SiteSettingsData {
  const [info, setInfo] = useState<SiteSettingsData>(cached ?? FALLBACK);

  useEffect(() => {
    if (cached) {
      setInfo(cached);
      return;
    }
    let cancelled = false;
    void fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d: { settings?: SiteSettingsData }) => {
        if (cancelled || !d.settings) return;
        cached = d.settings;
        setInfo(d.settings);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
