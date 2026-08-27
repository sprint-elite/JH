import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.banner.findMany({
    where: { placement: "HOME_IDEA" },
    orderBy: { sortOrder: "asc" },
  });
  console.log("count", rows.length);
  for (const r of rows) {
    console.log(r.sortOrder, r.isActive, r.title, r.imageUrl);
  }
}

main().finally(() => prisma.$disconnect());
