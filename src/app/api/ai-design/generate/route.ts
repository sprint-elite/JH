import { NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireUser } from "@/lib/auth";
import { assertApiRateLimit } from "@/lib/rate-limit";
import {
  AI_REFERENCE_MIME,
  MAX_AI_REFERENCE_BYTES,
  MAX_AI_REFERENCE_IMAGES,
} from "@/lib/ai-design/constants";
import {
  blockedDesignReason,
  generateOpenAiLogos,
  isOpenAiImageConfigured,
  type AiReferenceImage,
} from "@/lib/ai-design/openai-image";
import { fillInteriorHolesDataUrl } from "@/lib/image/fill-interior-holes-png";

export const maxDuration = 120;

function mimeFromName(name: string, fallback: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

async function filesFromForm(form: FormData): Promise<AiReferenceImage[]> {
  const raw = form.getAll("referenceImage");
  const out: AiReferenceImage[] = [];
  for (const item of raw) {
    if (!(item instanceof File) || item.size < 1) continue;
    const mime = AI_REFERENCE_MIME.has(item.type)
      ? item.type
      : mimeFromName(item.name, item.type);
    if (!AI_REFERENCE_MIME.has(mime)) {
      throw Object.assign(new Error("레퍼런스는 PNG, JPG, WEBP만 올릴 수 있습니다."), {
        status: 400,
      });
    }
    if (item.size > MAX_AI_REFERENCE_BYTES) {
      throw Object.assign(new Error("레퍼런스 이미지는 장당 4MB 이하여야 합니다."), {
        status: 400,
      });
    }
    out.push({
      bytes: Buffer.from(await item.arrayBuffer()),
      mime,
      filename: item.name || `reference-${out.length + 1}.png`,
    });
  }
  if (out.length > MAX_AI_REFERENCE_IMAGES) {
    throw Object.assign(
      new Error(`레퍼런스 이미지는 ${MAX_AI_REFERENCE_IMAGES}장까지 올릴 수 있습니다.`),
      { status: 400 },
    );
  }
  return out;
}

function parseLogoOnly(raw: FormDataEntryValue | boolean | undefined): boolean {
  if (typeof raw === "boolean") return raw;
  const s = String(raw ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "on" || s === "yes";
}

async function readInput(request: Request): Promise<{
  title: string;
  features: string;
  reference: string;
  referenceImages: AiReferenceImage[];
  logoOnly: boolean;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const logoOnly = parseLogoOnly(form.get("logoOnly"));
    return {
      title: logoOnly ? "" : String(form.get("title") ?? "").trim(),
      features: String(form.get("features") ?? "").trim(),
      reference: String(form.get("reference") ?? "").trim(),
      referenceImages: await filesFromForm(form),
      logoOnly,
    };
  }

  const body = (await request.json()) as {
    title?: string;
    features?: string;
    reference?: string;
    logoOnly?: boolean;
  };
  const logoOnly = Boolean(body.logoOnly);
  return {
    title: logoOnly ? "" : String(body.title ?? "").trim(),
    features: String(body.features ?? "").trim(),
    reference: String(body.reference ?? "").trim(),
    referenceImages: [],
    logoOnly,
  };
}

export async function POST(request: Request) {
  try {
    if (!isOpenAiImageConfigured()) {
      return jsonError(
        "OPENAI_API_KEY가 없습니다. .env에 키를 넣으면 AI 로고가 켜집니다.",
        503,
      );
    }
    const user = await requireUser();
    assertApiRateLimit(request, `ai-design:${user.id}`, 8, 15 * 60 * 1000);

    const input = await readInput(request);
    if (!input.logoOnly && input.title.length < 1) {
      return jsonError("문구를 입력해 주세요.", 400);
    }
    if (!input.logoOnly && input.title.length > 80) {
      return jsonError("문구는 80자 이하로 적어 주세요.", 400);
    }

    const features = input.features.slice(0, 600);
    const reference = input.reference.slice(0, 600);
    const blocked = blockedDesignReason(`${input.title} ${features} ${reference}`);
    if (blocked) return jsonError(blocked, 400);

    const images = await generateOpenAiLogos({
      title: input.title,
      features,
      reference,
      referenceImages: input.referenceImages,
      logoOnly: input.logoOnly,
    });
    const processed = await Promise.all(
      images.map(async (img) => ({
        ...img,
        dataUrl: await fillInteriorHolesDataUrl(img.dataUrl),
      })),
    );
    return NextResponse.json({
      images: processed.map((img, i) => ({
        id: `openai-${Date.now()}-${i}`,
        style: "openai",
        label: input.logoOnly
          ? processed.length > 1
            ? `AI 심볼 ${i + 1}`
            : "AI 심볼"
          : processed.length > 1
            ? `AI 로고 ${i + 1}`
            : "AI 로고",
        dataUrl: img.dataUrl,
        source: "openai" as const,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
