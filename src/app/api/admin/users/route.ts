import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { fetchAdminUsers } from "@/lib/admin-users";

export async function GET() {
  try {
    await requireAdmin();
    const users = await fetchAdminUsers();
    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
