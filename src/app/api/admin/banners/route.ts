import { NextResponse } from "next/server";
import type { BannerPlacement, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

const PLACEMENTS = new Set([
  "HOME_HERO",
  "HOME_PROMO",
  "HOME_IDEA",
  "HOME_GUIDE",
]);

export async function GET() {
  try {
    await requireAdmin();
    const banners = await prisma.banner.findMany({
      orderBy: [{ placement: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ banners });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
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

    if (!body.title?.trim()) return jsonError("제목을 입력해 주세요.", 400);
    if (!body.linkUrl?.trim()) return jsonError("링크를 입력해 주세요.", 400);
    if (!body.placement || !PLACEMENTS.has(body.placement)) {
      return jsonError("배치 위치가 올바르지 않습니다.", 400);
    }

    const banner = await prisma.banner.create({
      data: {
        placement: body.placement as BannerPlacement,
        tag: body.tag?.trim() || null,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        linkUrl: body.linkUrl.trim(),
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json({ banner }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export type BannerUpdate = Prisma.BannerUpdateInput;
