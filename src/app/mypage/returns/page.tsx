import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ReturnRequestClient } from "@/components/mypage/ReturnRequestClient";

export default async function MyReturnsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/returns");
  if (user.role === "ADMIN") redirect("/admin");
  return <ReturnRequestClient />;
}
