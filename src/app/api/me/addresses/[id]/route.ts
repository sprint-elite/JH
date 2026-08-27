import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toAddressDto, validateAddressInput } from "@/lib/addresses";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = (await request.json()) as {
      label?: string;
      recipientName?: string;
      phone?: string;
      zipCode?: string;
      address1?: string;
      address2?: string | null;
      isDefault?: boolean;
    };

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("배송지를 찾을 수 없습니다.", 404);

    const error = validateAddressInput({
      ...existing,
      ...body,
      recipientName: body.recipientName ?? existing.recipientName,
      phone: body.phone ?? existing.phone,
      zipCode: body.zipCode ?? existing.zipCode,
      address1: body.address1 ?? existing.address1,
    });
    if (error) return jsonError(error, 400);

    const isDefault =
      body.isDefault !== undefined ? !!body.isDefault : existing.isDefault;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id, id: { not: id } },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id },
        data: {
          label:
            body.label !== undefined
              ? body.label.trim() || "기본"
              : existing.label,
          recipientName: (body.recipientName ?? existing.recipientName).trim(),
          phone: (body.phone ?? existing.phone).trim(),
          zipCode: (body.zipCode ?? existing.zipCode).trim(),
          address1: (body.address1 ?? existing.address1).trim(),
          address2:
            body.address2 !== undefined
              ? body.address2?.trim() || null
              : existing.address2,
          isDefault,
        },
      });
    });

    return NextResponse.json({ address: toAddressDto(address) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;

    const existing = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return jsonError("배송지를 찾을 수 없습니다.", 404);

    await prisma.address.delete({ where: { id } });

    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
