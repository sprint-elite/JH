import { notFound, redirect } from "next/navigation";
import { MyOrderDetailView } from "@/components/mypage/MyOrderDetailView";
import { getCurrentUser } from "@/lib/auth";
import { fetchOrderDetailById } from "@/lib/orders";

type PageProps = { params: Promise<{ id: string }> };

export default async function MyOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage");
  if (user.role === "ADMIN") redirect("/admin/orders");

  const { id } = await params;
  const order = await fetchOrderDetailById(id);
  if (!order || order.customerId !== user.id) notFound();

  return <MyOrderDetailView order={order} />;
}
