import { redirect, notFound } from "next/navigation";
import { HomeHeader } from "@/components/home/HomeHeader";
import { HomeFooter } from "@/components/home/HomeFooter";
import { TossCheckoutClient } from "@/components/checkout/TossCheckoutClient";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

type PageProps = { params: Promise<{ orderId: string }> };

export default async function CheckoutPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    const { orderId } = await params;
    redirect(`/login?next=${encodeURIComponent(`/checkout/${orderId}`)}`);
  }
  if (user.role === "ADMIN") redirect("/admin/orders");

  const { orderId } = await params;
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { take: 1 },
        product: { select: { name: true } },
      },
    }),
    getSiteSettings(),
  ]);

  if (!order || order.userId !== user.id) notFound();
  if (order.status === "CANCELLED") {
    redirect(`/mypage/orders/${order.id}`);
  }
  if (order.paymentStatus === "PAID") {
    redirect(`/mypage/orders/${order.id}`);
  }

  const productName =
    order.items[0]?.productName ?? order.product.name ?? "상품";

  return (
    <div className="min-h-screen bg-zinc-50">
      <HomeHeader />
      <main>
        <TossCheckoutClient
          orderId={order.id}
          orderNumber={order.orderNumber}
          productName={productName}
          totalPrice={order.totalPrice}
          shippingFee={order.shippingFee}
          couponDiscount={order.couponDiscount}
          pointsUsed={order.pointsUsed}
          pointsBalance={user.pointsBalance}
          shippingName={order.shippingName}
          bankAccount={settings.bankAccount}
          bankHolder={settings.bankHolder}
        />
      </main>
      <HomeFooter />
    </div>
  );
}
