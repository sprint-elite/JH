import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { MyPageNav } from "@/components/mypage/MyPageNav";

export default function MyPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <HomeHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            마이페이지
          </h1>
          <div className="mt-4">
            <MyPageNav />
          </div>
        </div>
        {children}
      </main>
      <HomeFooter />
    </div>
  );
}
