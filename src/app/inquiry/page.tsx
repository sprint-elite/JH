import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { InquiryForm } from "@/components/support/InquiryForm";

export default function InquiryPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <HomeHeader />
      <main>
        <InquiryForm />
      </main>
      <HomeFooter />
    </div>
  );
}
