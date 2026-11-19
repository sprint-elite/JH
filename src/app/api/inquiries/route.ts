import { NextResponse } from "next/server";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { assertAuthRateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notify";
import { brandedMailSubject } from "@/lib/site-settings";

export async function GET() {
  try {
    const user = await requireUser();
    const inquiries = await prisma.inquiry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({
      inquiries: inquiries.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        repliedAt: i.repliedAt?.toISOString() ?? null,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: Request) {
  try {
    assertAuthRateLimit(request, "inquiry");
    const user = await getCurrentUser();
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      subject?: string;
      body?: string;
    };

    const name = (body.name ?? user?.name ?? "").trim();
    const email = (body.email ?? user?.email ?? "").trim().toLowerCase();
    const subject = body.subject?.trim() ?? "";
    const content = body.body?.trim() ?? "";

    if (!name || !email || !subject) {
      return jsonError("이름, 이메일, 제목을 입력해 주세요.", 400);
    }
    if (content.length < 5) {
      return jsonError("문의 내용은 5자 이상 입력해 주세요.", 400);
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: user?.id ?? null,
        name,
        email,
        subject,
        body: content,
      },
    });

    void notify({
      type: "INQUIRY",
      toEmail: email,
      subject: await brandedMailSubject(`문의 접수: ${subject}`),
      body: `문의가 접수되었습니다. 확인 후 답변드리겠습니다.`,
      meta: { inquiryId: inquiry.id },
    });

    return NextResponse.json(
      {
        inquiry: {
          ...inquiry,
          createdAt: inquiry.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleApiError(err);
  }
}
