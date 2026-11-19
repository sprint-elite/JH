import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { InquiryForm } from "@/components/support/InquiryForm";
import { Suspense } from "react";

export default function InquiryPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <HomeHeader />
      <main>
        <Suspense fallback={<div className="min-h-[40vh]" />}>
          <InquiryForm />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  );
}
