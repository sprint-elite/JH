import { NextResponse } from "next/server";
import type { ProductDetailSectionType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError } from "@/lib/api-utils";

type Ctx = { params: Promise<{ id: string }> };

const SECTION_TYPES = new Set([
  "STORY",
  "INFO",
  "GUIDE",
  "SIZE",
  "FAQ",
  "SHIPPING",
  "CAUTION",
]);

export async function GET(_request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        saleType: true,
        stockQuantity: true,
        noticeJson: true,
      },
    });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    const [sections, images, discounts] = await Promise.all([
      prisma.productDetailSection.findMany({
        where: { productId: id },
        orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
      }),
      prisma.productImage.findMany({
        where: { productId: id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.quantityDiscountRule.findMany({
        where: { productId: id },
        orderBy: { minQuantity: "asc" },
      }),
    ]);

    return NextResponse.json({
      product: {
        ...product,
        noticeItems: Array.isArray(product.noticeJson)
          ? product.noticeJson
          : [],
      },
      sections,
      images,
      discounts,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request, context: Ctx) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return jsonError("상품을 찾을 수 없습니다.", 404);

    const body = (await request.json()) as {
      stockQuantity?: number | null;
      noticeItems?: Array<{ label: string; value: string }>;
      sections?: Array<{
        id?: string;
        type: string;
        title: string;
        body: string;
        imageUrl?: string | null;
        sortOrder?: number;
        isActive?: boolean;
      }>;
      images?: Array<{
        id?: string;
        url: string;
        alt?: string | null;
        sortOrder?: number;
        isPrimary?: boolean;
      }>;
      discounts?: Array<{
        id?: string;
        minQuantity: number;
        unitPrice?: number | null;
        discountRate?: number | null;
        label?: string | null;
        sortOrder?: number;
      }>;
    };

    await prisma.$transaction(async (tx) => {
      if (body.stockQuantity !== undefined || body.noticeItems !== undefined) {
        await tx.product.update({
          where: { id },
          data: {
            ...(body.stockQuantity !== undefined
              ? {
                  stockQuantity:
                    body.stockQuantity == null
                      ? null
                      : Math.max(0, Math.round(Number(body.stockQuantity))),
                }
              : {}),
            ...(body.noticeItems !== undefined
              ? {
                  noticeJson: body.noticeItems
                    .filter((n) => n.label?.trim() && n.value?.trim())
                    .map((n) => ({
                      label: n.label.trim(),
                      value: n.value.trim(),
                    })),
                }
              : {}),
          },
        });
      }

      if (body.sections) {
        await tx.productDetailSection.deleteMany({ where: { productId: id } });
        for (const [i, s] of body.sections.entries()) {
          if (!SECTION_TYPES.has(s.type)) continue;
          if (!s.title?.trim() || !s.body?.trim()) continue;
          await tx.productDetailSection.create({
            data: {
              productId: id,
              type: s.type as ProductDetailSectionType,
              title: s.title.trim(),
              body: s.body.trim(),
              imageUrl: s.imageUrl?.trim() || null,
              sortOrder: s.sortOrder ?? i,
              isActive: s.isActive !== false,
            },
          });
        }
      }

      if (body.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        for (const [i, img] of body.images.entries()) {
          if (!img.url?.trim()) continue;
          await tx.productImage.create({
            data: {
              productId: id,
              url: img.url.trim(),
              alt: img.alt?.trim() || null,
              sortOrder: img.sortOrder ?? i,
              isPrimary: !!img.isPrimary,
            },
          });
        }
      }

      if (body.discounts) {
        await tx.quantityDiscountRule.deleteMany({ where: { productId: id } });
        for (const [i, d] of body.discounts.entries()) {
          const minQuantity = Math.round(Number(d.minQuantity));
          if (!Number.isFinite(minQuantity) || minQuantity < 1) continue;
          await tx.quantityDiscountRule.create({
            data: {
              productId: id,
              minQuantity,
              unitPrice:
                d.unitPrice != null ? Math.round(Number(d.unitPrice)) : null,
              discountRate:
                d.discountRate != null ? Number(d.discountRate) : null,
              label: d.label?.trim() || null,
              sortOrder: d.sortOrder ?? i,
            },
          });
        }
      }
    });

    return GET(request, context);
  } catch (err) {
    return handleApiError(err);
  }
}
