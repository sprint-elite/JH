import { redirect } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { getCurrentUser } from "@/lib/auth";
import { fetchCartForUser } from "@/lib/cart";

export default async function CartPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/cart");
  if (user.role === "ADMIN") redirect("/admin/orders");

  const cart = await fetchCartForUser(user.id);

  return (
    <div className="min-h-screen bg-zinc-50">
      <HomeHeader />
      <main>
        <CartPageClient initialCart={cart} />
      </main>
      <HomeFooter />
    </div>
  );
}
