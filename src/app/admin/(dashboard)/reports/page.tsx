import { requireAdmin } from "@/lib/auth";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";

export default async function AdminReportsPage() {
  await requireAdmin();
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-xl font-bold text-slate-900">매출 리포트</h1>
      <AdminReportsClient />
    </div>
  );
}
