import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { User } from "@/types";

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  emailVerifiedAt: true,
  pointsBalance: true,
  isGuest: true,
  deletedAt: true,
  createdAt: true,
} as const;

export function toPublicUser(dbUser: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: User["role"];
  emailVerifiedAt: Date | null;
  pointsBalance: number;
  isGuest: boolean;
  createdAt: Date;
}): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    phone: dbUser.phone,
    role: dbUser.role,
    emailVerifiedAt: dbUser.emailVerifiedAt?.toISOString() ?? null,
    pointsBalance: dbUser.pointsBalance,
    isGuest: dbUser.isGuest,
    createdAt: dbUser.createdAt.toISOString(),
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.userId },
    select: publicUserSelect,
  });

  if (!dbUser || dbUser.deletedAt) return null;

  return toPublicUser(dbUser);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("로그인이 필요합니다.", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AuthError("관리자 권한이 필요합니다.", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
