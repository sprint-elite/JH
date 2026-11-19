import { requireAdmin } from "@/lib/auth";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return <AdminSettingsForm />;
}
