import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminCouponManager } from "@/components/admin/AdminCouponManager";

export default async function AdminCouponsPage() {
  await requireAdmin();
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { claims: true } } },
  });

  return (
    <AdminCouponManager
      initialCoupons={coupons.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        discountType: c.discountType,
        discountValue: c.discountValue,
        minOrderAmount: c.minOrderAmount,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        perUserLimit: c.perUserLimit,
        startsAt: c.startsAt?.toISOString() ?? null,
        endsAt: c.endsAt?.toISOString() ?? null,
        isActive: c.isActive,
        claimCount: c._count.claims,
        createdAt: c.createdAt.toISOString(),
      }))}
    />
  );
}
