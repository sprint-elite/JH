import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";

const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("이미지 파일이 필요합니다.", 400);
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("PNG, JPG, WEBP만 업로드할 수 있습니다.", 400);
    }
    if (file.size > 8 * 1024 * 1024) {
      return jsonError("파일 크기는 8MB 이하여야 합니다.", 400);
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const ext = EXT[file.type] ?? "png";
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "mockups");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({
      url: `/uploads/mockups/${filename}`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
