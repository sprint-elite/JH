import { requireAdmin } from "@/lib/auth";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">사이트 설정</h1>
      <p className="text-sm text-slate-500">
        사업자·CS·계좌·배송비 정보를 관리합니다.
      </p>
      <AdminSettingsForm />
    </div>
  );
}
