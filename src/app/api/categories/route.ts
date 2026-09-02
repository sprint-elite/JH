import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { fetchProductListCategories } from "@/lib/product-list";

export async function GET() {
  try {
    const categories = await fetchProductListCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
