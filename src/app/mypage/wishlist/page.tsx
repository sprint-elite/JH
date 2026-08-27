import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { fetchWishlist } from "@/lib/wishlist";
import { WishlistPageClient } from "@/components/mypage/WishlistPageClient";

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/wishlist");
  if (user.role === "ADMIN") redirect("/admin");

  const items = await fetchWishlist(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">찜 목록</h1>
      <WishlistPageClient initialItems={items} />
    </div>
  );
}
