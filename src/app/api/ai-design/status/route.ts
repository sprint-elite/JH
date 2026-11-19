import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { requireUser } from "@/lib/auth";
import {
  getOpenAiImageModel,
  isOpenAiImageConfigured,
} from "@/lib/ai-design/openai-image";

export async function GET() {
  try {
    await requireUser();
    const configured = isOpenAiImageConfigured();
    return NextResponse.json({
      configured,
      model: configured ? getOpenAiImageModel() : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
