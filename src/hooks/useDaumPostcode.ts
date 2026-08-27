"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          address: string;
          roadAddress: string;
          jibunAddress: string;
          buildingName?: string;
        }) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void };
    };
  }
}

const SCRIPT_ID = "daum-postcode-script";
const SCRIPT_SRC =
  "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

function loadDaumPostcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject();
  if (window.daum?.Postcode) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      if (window.daum?.Postcode) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("우편번호 스크립트 로드 실패"));
    document.body.appendChild(script);
  });
}

export type PostcodeResult = {
  zipCode: string;
  address: string;
};

export function useDaumPostcode() {
  const open = useCallback(async (): Promise<PostcodeResult | null> => {
    try {
      await loadDaumPostcode();
    } catch {
      alert("우편번호 서비스를 불러오지 못했습니다.");
      return null;
    }

    return new Promise((resolve) => {
      if (!window.daum?.Postcode) {
        resolve(null);
        return;
      }
      new window.daum.Postcode({
        oncomplete(data) {
          const base = data.roadAddress || data.jibunAddress || data.address;
          const extra = data.buildingName ? ` ${data.buildingName}` : "";
          resolve({
            zipCode: data.zonecode,
            address: `${base}${extra}`.trim(),
          });
        },
      }).open();
    });
  }, []);

  return { openPostcode: open };
}
