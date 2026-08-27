import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { fetchAdminCategories } from "@/lib/admin-catalog";
import { slugify } from "@/lib/builder-types";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await fetchAdminCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const name = body.name?.trim() ?? "";
    if (!name) return jsonError("카테고리명을 입력해 주세요.", 400);

    const slug = (body.slug?.trim() || slugify(name)).toLowerCase();
    if (!slug) return jsonError("슬러그를 입력해 주세요.", 400);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return jsonError("이미 사용 중인 슬러그입니다.", 400);

    await prisma.category.create({
      data: {
        name,
        slug,
        sortOrder: Number.isFinite(body.sortOrder) ? Number(body.sortOrder) : 0,
        isActive: body.isActive ?? true,
      },
    });

    const categories = await fetchAdminCategories();
    return NextResponse.json({ categories }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
