import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal/LegalPageShell";
import { getSiteSettings } from "@/lib/site-settings";
import { SUPPORT_FAQS } from "@/lib/support-faq";

export async function generateMetadata(): Promise<Metadata> {
  const info = await getSiteSettings();
  return {
    title: "자주 묻는 질문",
    description: `${info.brandName} FAQ`,
  };
}

export default async function FaqPage() {
  const info = await getSiteSettings();
  return (
    <LegalPageShell title="자주 묻는 질문">
      <p>
        주문·제작·배송과 관련해 자주 묻는 내용을 모았습니다. 해결되지 않으면{" "}
        <a href={`mailto:${info.email}`} className="underline">
          {info.email}
        </a>
        로 문의해 주세요.
      </p>

      {SUPPORT_FAQS.map((item) => (
        <LegalSection key={item.q} title={item.q}>
          <p>{item.a}</p>
        </LegalSection>
      ))}

      <p className="pt-2">
        관련 안내:{" "}
        <Link href="/returns" className="underline hover:text-zinc-900">
          교환·반품
        </Link>
        {" · "}
        <Link href="/terms" className="underline hover:text-zinc-900">
          이용약관
        </Link>
        {" · "}
        <Link href="/privacy" className="underline hover:text-zinc-900">
          개인정보처리방침
        </Link>
      </p>
    </LegalPageShell>
  );
}
