import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

function parseOptionalDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET() {
  try {
    await requireAdmin();
    const popups = await prisma.sitePopup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({
      popups: popups.map((p) => ({
        ...p,
        startsAt: p.startsAt?.toISOString() ?? null,
        endsAt: p.endsAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
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

    const title = body.title?.trim() ?? "";
    if (!title) return jsonError("제목을 입력해 주세요.", 400);

    const popup = await prisma.sitePopup.create({
      data: {
        title,
        body: body.body?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        linkUrl: body.linkUrl?.trim() || null,
        linkLabel: body.linkLabel?.trim() || null,
        isActive: body.isActive !== false,
        startsAt: parseOptionalDate(body.startsAt),
        endsAt: parseOptionalDate(body.endsAt),
        dismissHours: Math.max(
          0,
          Math.min(720, Math.round(Number(body.dismissHours) || 24)),
        ),
        sortOrder: Math.round(Number(body.sortOrder) || 0),
      },
    });

    return NextResponse.json(
      {
        popup: {
          ...popup,
          startsAt: popup.startsAt?.toISOString() ?? null,
          endsAt: popup.endsAt?.toISOString() ?? null,
          createdAt: popup.createdAt.toISOString(),
          updatedAt: popup.updatedAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
