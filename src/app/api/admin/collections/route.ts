import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    const collections = await prisma.productCollection.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    return NextResponse.json({ collections });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as {
      slug?: string;
      name?: string;
      type?: string;
      sortOrder?: number;
      isActive?: boolean;
    };
    const slug = body.slug?.trim().toLowerCase();
    const name = body.name?.trim();
    if (!slug || !name) return jsonError("슬러그와 이름을 입력해 주세요.", 400);

    const collection = await prisma.productCollection.create({
      data: {
        slug,
        name,
        type: (body.type as "BEST" | "NEW" | "TRENDING" | "TEMPLATE" | "CUSTOM") || "CUSTOM",
        sortOrder: Number(body.sortOrder) || 0,
        isActive: body.isActive !== false,
      },
    });
    return NextResponse.json({ collection }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
