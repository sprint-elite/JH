import { redirect } from "next/navigation";
import { MyProfileForm } from "@/components/mypage/MyProfileForm";
import { getCurrentUser } from "@/lib/auth";

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/mypage/profile");
  if (user.role === "ADMIN") redirect("/admin/orders");

  return <MyProfileForm user={user} />;
}
