import { buildAiImagePrompt } from "@/lib/ai-design/prompt-builder";

const BLOCKED =
  /나이키|아디다스|슈프림|디즈니|포켓몬|피카츄|카카오프렌즈|라인프렌즈|노스페이스|구찌|샤넬|나이키|mlb|nba|nike|adidas|supreme|disney|pokemon|gucci|chanel|north\s*face|hello\s*kitty|mario|nintendo|starbucks/i;

export type AiReferenceImage = {
  bytes: Buffer;
  mime: string;
  filename: string;
};

export function blockedDesignReason(prompt: string): string | null {
  if (BLOCKED.test(prompt)) {
    return "상표·캐릭터 로고는 만들 수 없습니다. 동아리·팀·행사 이름만 적어 주세요.";
  }
  return null;
}

export function isOpenAiImageConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiImageModel() {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

type OpenAiImage = { b64_json?: string; url?: string };

function apiError(message: string, status: number, code?: string) {
  const err = new Error(message) as Error & { status: number; code?: string };
  err.status = status >= 400 && status < 600 ? status : 502;
  err.code = code;
  return err;
}

async function toDataUrl(row: OpenAiImage): Promise<string | null> {
  if (row.b64_json) return `data:image/png;base64,${row.b64_json}`;
  if (!row.url) return null;
  const res = await fetch(row.url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function hasHangul(text: string) {
  return /[\uAC00-\uD7A3]/.test(text);
}

function buildPrompt(input: {
  title: string;
  features?: string;
  reference?: string;
  hasReferenceImages?: boolean;
  logoOnly?: boolean;
}) {
  return buildAiImagePrompt(input);
}

async function parseImageResponse(res: Response): Promise<{ dataUrl: string; label: string }[]> {
  const json = (await res.json()) as {
    error?: { message?: string; code?: string };
    data?: OpenAiImage[];
  };

  if (!res.ok) {
    throw apiError(json.error?.message || "이미지 생성에 실패했습니다.", res.status, json.error?.code);
  }

  const out: { dataUrl: string; label: string }[] = [];
  for (const row of json.data ?? []) {
    const dataUrl = await toDataUrl(row);
    if (dataUrl) out.push({ dataUrl, label: "AI 로고" });
  }
  if (out.length === 0) {
    throw apiError("생성된 이미지를 받지 못했습니다.", 502);
  }
  return out;
}

async function requestLogos(
  key: string,
  model: string,
  prompt: string,
  opts?: { simple?: boolean },
): Promise<{ dataUrl: string; label: string }[]> {
  const isGptImage = model.startsWith("gpt-image");
  const body: Record<string, unknown> = {
    model,
    prompt,
    n: 1,
    size: "1024x1024",
  };
  if (isGptImage) {
    if (!opts?.simple) {
      body.quality = "high";
      body.background = "transparent";
      body.output_format = "png";
    }
  } else {
    body.quality = "hd";
    body.response_format = "b64_json";
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseImageResponse(res);
}

function appendEditImages(form: FormData, images: AiReferenceImage[]) {
  const field = images.length > 1 ? "image[]" : "image";
  for (const img of images) {
    const blob = new Blob([new Uint8Array(img.bytes)], { type: img.mime });
    form.append(field, blob, img.filename);
  }
}

async function requestEdits(
  key: string,
  model: string,
  prompt: string,
  images: AiReferenceImage[],
  opts?: { simple?: boolean },
): Promise<{ dataUrl: string; label: string }[]> {
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("n", "1");
  form.append("size", "1024x1024");
  if (!opts?.simple) {
    form.append("quality", "high");
    form.append("background", "transparent");
    form.append("output_format", "png");
  }
  appendEditImages(form, images);

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
    },
    body: form,
  });

  return parseImageResponse(res);
}

export async function generateOpenAiLogos(input: {
  title: string;
  features?: string;
  reference?: string;
  referenceImages?: AiReferenceImage[];
  logoOnly?: boolean;
}): Promise<{ dataUrl: string; label: string }[]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw apiError("OPENAI_API_KEY가 없습니다.", 503);
  }

  const model = getOpenAiImageModel();
  const refs = input.referenceImages ?? [];
  const prompt = buildPrompt({
    title: input.logoOnly ? "" : input.title,
    features: input.features,
    reference: input.reference,
    hasReferenceImages: refs.length > 0,
    logoOnly: input.logoOnly,
  });

  if (refs.length > 0) {
    if (!model.startsWith("gpt-image")) {
      throw apiError(
        "레퍼런스 이미지는 GPT 이미지 모델에서만 전달됩니다. OPENAI_IMAGE_MODEL을 gpt-image-1로 두세요.",
        400,
      );
    }
    try {
      return await requestEdits(key, model, prompt, refs);
    } catch (first) {
      try {
        return await requestEdits(key, model, prompt, refs, { simple: true });
      } catch {
        throw first;
      }
    }
  }

  return generateWithFallback(
    key,
    model,
    prompt,
    input.logoOnly ? "" : input.title,
  );
}

async function generateWithFallback(
  key: string,
  model: string,
  prompt: string,
  title: string,
) {
  try {
    return await requestLogos(key, model, prompt);
  } catch (first) {
    if (model.startsWith("gpt-image")) {
      try {
        return await requestLogos(key, model, prompt, { simple: true });
      } catch {
        /* hangul is unreadable on dall-e-3; skip that fallback */
      }
    }
    if (model !== "dall-e-3" && !hasHangul(title)) {
      return requestLogos(key, "dall-e-3", prompt);
    }
    throw first;
  }
}
