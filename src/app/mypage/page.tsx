import { redirect } from "next/navigation";
import { MyOrderHistoryTable } from "@/components/mypage/MyOrderHistoryTable";
import { MyOrderStatusSection } from "@/components/mypage/MyOrderStatusSection";
import { MyPageRecommendations } from "@/components/mypage/MyPageRecommendations";
import { MyPageSummaryBar } from "@/components/mypage/MyPageSummaryBar";
import { getCurrentUser } from "@/lib/auth";
import { fetchHomeCatalog } from "@/lib/catalog";
import { filterRecentOrders } from "@/lib/mypage-orders";
import { fetchOrdersForUser } from "@/lib/orders";

export default async function MyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage");
  if (user.role === "ADMIN") redirect("/admin/orders");

  const [orders, catalog] = await Promise.all([
    fetchOrdersForUser(user.id),
    fetchHomeCatalog(),
  ]);

  const recentOrders = filterRecentOrders(orders);
  const hasOlderOrders = orders.length > recentOrders.length;
  const unpaidCount = orders.filter(
    (o) => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED",
  ).length;
  const shippingCount = orders.filter((o) => o.status === "SHIPPED").length;

  return (
    <div className="space-y-8">
      <MyPageSummaryBar
        user={user}
        orderCount={orders.length}
        unpaidCount={unpaidCount}
        shippingCount={shippingCount}
      />

      <MyOrderStatusSection
        orders={orders}
        showViewMore={hasOlderOrders}
      />

      <MyPageRecommendations products={catalog.allProducts} />

      {hasOlderOrders && <MyOrderHistoryTable orders={orders} />}
    </div>
  );
}
