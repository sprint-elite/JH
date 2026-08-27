import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: string;
      adminReply?: string;
    };

    const data: {
      status?: string;
      adminReply?: string | null;
      repliedAt?: Date | null;
    } = {};
    if (body.status) data.status = body.status;
    if (body.adminReply !== undefined) {
      data.adminReply = body.adminReply.trim() || null;
      data.repliedAt = body.adminReply.trim() ? new Date() : null;
      if (body.adminReply.trim() && !body.status) data.status = "ANSWERED";
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data,
    });

    if (inquiry.adminReply) {
      void notify({
        type: "INQUIRY",
        toEmail: inquiry.email,
        subject: `[JH MAKER] 문의 답변: ${inquiry.subject}`,
        body: inquiry.adminReply,
        meta: { inquiryId: inquiry.id },
      });
    }

    return NextResponse.json({
      inquiry: {
        ...inquiry,
        createdAt: inquiry.createdAt.toISOString(),
        updatedAt: inquiry.updatedAt.toISOString(),
        repliedAt: inquiry.repliedAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
