import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireUser } from "@/lib/auth";
import { assertApiRateLimit } from "@/lib/rate-limit";
import { fillInteriorHolesPng } from "@/lib/image/fill-interior-holes-png";

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
    const user = await requireUser();
    assertApiRateLimit(
      request,
      `design-image-upload:${user.id}`,
      30,
      15 * 60 * 1000,
    );
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("이미지 파일이 필요합니다.", 400);
    }
    if (!ALLOWED.has(file.type)) {
      return jsonError("PNG, JPG, WEBP만 업로드할 수 있습니다.", 400);
    }
    if (file.size < 1) return jsonError("빈 파일은 올릴 수 없습니다.", 400);
    if (file.size > 8 * 1024 * 1024) {
      return jsonError("파일 크기는 8MB 이하여야 합니다.", 400);
    }

    const raw = Buffer.from(await file.arrayBuffer());
    const bytes =
      file.type === "image/png" || file.type === "image/webp"
        ? Buffer.from(await fillInteriorHolesPng(raw))
        : raw;
    const ext = EXT[file.type] ?? "png";
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "designs");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    return NextResponse.json({ url: `/uploads/designs/${filename}` });
  } catch (err) {
    return handleApiError(err);
  }
}
