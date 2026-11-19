import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { handleApiError, jsonError } from "@/lib/api-utils";

const SAFE_NAME = /^[a-f0-9-]{8,}\.(png|jpe?g|webp)$/i;

const TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

type Ctx = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { filename } = await context.params;
    if (!SAFE_NAME.test(filename)) {
      return jsonError("파일을 찾을 수 없습니다.", 404);
    }
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "designs",
      filename,
    );
    const bytes = await readFile(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "png";
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": TYPE[ext] ?? "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return jsonError("파일을 찾을 수 없습니다.", 404);
    return handleApiError(err);
  }
}
