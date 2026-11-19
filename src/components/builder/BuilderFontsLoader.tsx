"use client";

import { useEffect } from "react";
import { builderGoogleFontsStylesheetHref } from "@/lib/builder-fonts";

const LINK_ID = "jh-builder-google-fonts";

/** 빌더·상품 상세(임베디드 빌더)에서 웹폰트 CSS 로드 */
export function BuilderFontsLoader() {
  useEffect(() => {
    if (document.getElementById(LINK_ID)) return;
    const link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    link.href = builderGoogleFontsStylesheetHref();
    document.head.appendChild(link);
  }, []);
  return null;
}
