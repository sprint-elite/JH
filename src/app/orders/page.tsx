import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { GuestOrderLookup } from "@/components/orders/GuestOrderLookup";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (user && !user.isGuest) {
    redirect("/mypage");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <HomeHeader />
      <main>
        <GuestOrderLookup signedIn={Boolean(user)} />
      </main>
      <HomeFooter />
    </div>
  );
}
