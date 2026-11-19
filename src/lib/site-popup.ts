import { prisma } from "@/lib/db";

export type HomePopupDto = {
  id: string;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  dismissHours: number;
};

export function isPopupInSchedule(
  startsAt: Date | null,
  endsAt: Date | null,
  now = new Date(),
): boolean {
  if (startsAt && startsAt.getTime() > now.getTime()) return false;
  if (endsAt && endsAt.getTime() < now.getTime()) return false;
  return true;
}

export async function fetchActiveHomePopup(): Promise<HomePopupDto | null> {
  const rows = await prisma.sitePopup.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: 20,
  });
  const row = rows.find((r) => isPopupInSchedule(r.startsAt, r.endsAt));
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    linkLabel: row.linkLabel,
    dismissHours: row.dismissHours,
  };
}
