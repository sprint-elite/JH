import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: string;
      isActive?: boolean;
      minOrderAmount?: number;
      usageLimit?: number | null;
    };

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.minOrderAmount !== undefined
          ? { minOrderAmount: Math.round(Number(body.minOrderAmount) || 0) }
          : {}),
        ...(body.usageLimit !== undefined
          ? {
              usageLimit:
                body.usageLimit == null
                  ? null
                  : Math.round(Number(body.usageLimit)),
            }
          : {}),
      },
    });
    return NextResponse.json({ coupon });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
