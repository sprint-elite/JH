import { NextResponse } from "next/server";
import type { BannerPlacement } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

const PLACEMENTS = new Set([
  "HOME_HERO",
  "HOME_PROMO",
  "HOME_IDEA",
  "HOME_GUIDE",
]);

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      placement?: string;
      tag?: string | null;
      title?: string;
      subtitle?: string | null;
      imageUrl?: string | null;
      linkUrl?: string;
      sortOrder?: number;
      isActive?: boolean;
    };

    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) return jsonError("배너를 찾을 수 없습니다.", 404);

    if (body.placement && !PLACEMENTS.has(body.placement)) {
      return jsonError("배치 위치가 올바르지 않습니다.", 400);
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...(body.placement
          ? { placement: body.placement as BannerPlacement }
          : {}),
        ...(body.tag !== undefined ? { tag: body.tag?.trim() || null } : {}),
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.subtitle !== undefined
          ? { subtitle: body.subtitle?.trim() || null }
          : {}),
        ...(body.imageUrl !== undefined
          ? { imageUrl: body.imageUrl?.trim() || null }
          : {}),
        ...(body.linkUrl !== undefined ? { linkUrl: body.linkUrl.trim() } : {}),
        ...(body.sortOrder !== undefined
          ? { sortOrder: Number(body.sortOrder) || 0 }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    return NextResponse.json({ banner });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
