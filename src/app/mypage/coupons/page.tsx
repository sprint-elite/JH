import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MyCouponsClient } from "@/components/mypage/MyCouponsClient";

export default async function MyCouponsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/coupons");
  if (user.role === "ADMIN") redirect("/admin");

  const claims = await prisma.couponClaim.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { coupon: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">쿠폰</h1>
      <MyCouponsClient
        initialCoupons={claims.map((c) => ({
          claimId: c.id,
          code: c.coupon.code,
          name: c.coupon.name,
          discountType: c.coupon.discountType,
          discountValue: c.coupon.discountValue,
          minOrderAmount: c.coupon.minOrderAmount,
          isActive: c.coupon.isActive,
          endsAt: c.coupon.endsAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
