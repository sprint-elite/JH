import { prisma } from "@/lib/db";
import type { UserRole } from "@/types";

export type AdminUserDto = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  orderCount: number;
  designCount: number;
  createdAt: string;
};

export async function fetchAdminUsers(): Promise<AdminUserDto[]> {
  const rows = await prisma.user.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          orders: true,
          designs: true,
        },
      },
    },
  });

  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    orderCount: u._count.orders,
    designCount: u._count.designs,
    createdAt: u.createdAt.toISOString(),
  }));
}

export function isUserRole(value: unknown): value is UserRole {
  return value === "CUSTOMER" || value === "ADMIN";
}
