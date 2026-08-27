import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdmin();
    const reviews = await prisma.productReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
    });
    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        isVisible: r.isVisible,
        isHot: r.isHot,
        createdAt: r.createdAt.toISOString(),
        userName: r.user.name,
        userEmail: r.user.email,
        productName: r.product.name,
        productSlug: r.product.slug,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
