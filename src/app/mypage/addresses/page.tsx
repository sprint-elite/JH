import { redirect } from "next/navigation";
import { MyAddressManager } from "@/components/mypage/MyAddressManager";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toAddressDto } from "@/lib/addresses";

export default async function MyAddressesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/addresses");
  if (user.role === "ADMIN") redirect("/admin/orders");

  const rows = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return <MyAddressManager initialAddresses={rows.map(toAddressDto)} />;
}
