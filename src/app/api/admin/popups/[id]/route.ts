import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const existing = await prisma.sitePopup.findUnique({ where: { id } });
    if (!existing) return jsonError("팝업을 찾을 수 없습니다.", 404);

    const body = (await request.json()) as {
      title?: string;
      body?: string | null;
      imageUrl?: string | null;
      linkUrl?: string | null;
      linkLabel?: string | null;
      isActive?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      dismissHours?: number;
      sortOrder?: number;
    };

    const popup = await prisma.sitePopup.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.body !== undefined ? { body: body.body?.trim() || null } : {}),
        ...(body.imageUrl !== undefined
          ? { imageUrl: body.imageUrl?.trim() || null }
          : {}),
        ...(body.linkUrl !== undefined
          ? { linkUrl: body.linkUrl?.trim() || null }
          : {}),
        ...(body.linkLabel !== undefined
          ? { linkLabel: body.linkLabel?.trim() || null }
          : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.startsAt !== undefined
          ? { startsAt: parseOptionalDate(body.startsAt) }
          : {}),
        ...(body.endsAt !== undefined
          ? { endsAt: parseOptionalDate(body.endsAt) }
          : {}),
        ...(body.dismissHours !== undefined
          ? {
              dismissHours: Math.max(
                0,
                Math.min(720, Math.round(Number(body.dismissHours) || 0)),
              ),
            }
          : {}),
        ...(body.sortOrder !== undefined
          ? { sortOrder: Math.round(Number(body.sortOrder) || 0) }
          : {}),
      },
    });

    return NextResponse.json({
      popup: {
        ...popup,
        startsAt: popup.startsAt?.toISOString() ?? null,
        endsAt: popup.endsAt?.toISOString() ?? null,
        createdAt: popup.createdAt.toISOString(),
        updatedAt: popup.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.sitePopup.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
