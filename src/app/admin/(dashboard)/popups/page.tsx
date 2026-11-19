import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AdminPopupManager } from "@/components/admin/AdminPopupManager";

export default async function AdminPopupsPage() {
  await requireAdmin();
  const popups = await prisma.sitePopup.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AdminPopupManager
      initialPopups={popups.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        imageUrl: p.imageUrl,
        linkUrl: p.linkUrl,
        linkLabel: p.linkLabel,
        isActive: p.isActive,
        startsAt: p.startsAt?.toISOString() ?? null,
        endsAt: p.endsAt?.toISOString() ?? null,
        dismissHours: p.dismissHours,
        sortOrder: p.sortOrder,
      }))}
    />
  );
}
