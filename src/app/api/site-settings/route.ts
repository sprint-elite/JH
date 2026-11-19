import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { getSiteSettings } from "@/lib/site-settings";

/** 푸터·헤더·입금 안내 등 공개 사업자 정보 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
