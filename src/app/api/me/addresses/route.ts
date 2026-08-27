import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { toAddressDto, validateAddressInput } from "@/lib/addresses";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });
    return NextResponse.json({ addresses: rows.map(toAddressDto) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as {
      label?: string;
      recipientName?: string;
      phone?: string;
      zipCode?: string;
      address1?: string;
      address2?: string | null;
      isDefault?: boolean;
    };

    const error = validateAddressInput(body);
    if (error) return jsonError(error, 400);

    const count = await prisma.address.count({ where: { userId: user.id } });
    const isDefault = body.isDefault === true || count === 0;

    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId: user.id,
          label: body.label?.trim() || "기본",
          recipientName: body.recipientName!.trim(),
          phone: body.phone!.trim(),
          zipCode: body.zipCode!.trim(),
          address1: body.address1!.trim(),
          address2: body.address2?.trim() || null,
          isDefault,
        },
      });
    });

    return NextResponse.json({ address: toAddressDto(address) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
