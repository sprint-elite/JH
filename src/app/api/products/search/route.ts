import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { searchProducts } from "@/lib/product-search";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 1) {
      return NextResponse.json({ products: [] });
    }
    if (q.length > 80) {
      return jsonError("검색어가 너무 깁니다.", 400);
    }

    const takeRaw = Number(searchParams.get("take") ?? 8);
    const take = Number.isFinite(takeRaw)
      ? Math.min(20, Math.max(1, Math.round(takeRaw)))
      : 8;

    const products = await searchProducts(q, take);
    return NextResponse.json({ products });
  } catch (err) {
    return handleApiError(err);
  }
}
