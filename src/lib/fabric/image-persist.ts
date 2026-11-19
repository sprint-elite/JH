import type { DesignJson, DesignState } from "@/types/builder";

/** Fabric 디자인 JSON에 이미지를 data URL로 영구 저장 */

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("이미지를 읽을 수 없습니다."));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("이미지를 읽을 수 없습니다."));
    reader.readAsDataURL(file);
  });
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const res = await fetch(blobUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("이미지 변환에 실패했습니다."));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error("이미지 변환에 실패했습니다."));
    reader.readAsDataURL(blob);
  });
}

function isImageObjectRecord(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object") return false;
  const type = (obj as Record<string, unknown>).type;
  return type === "image" || type === "Image";
}

const DATA_URL_UPLOAD_MIN = 12_000;

export async function persistDesignImageSrc(src: string): Promise<string> {
  let next = src;
  if (next.startsWith("blob:")) {
    next = await blobUrlToDataUrl(next);
  }
  if (typeof window === "undefined") return next;
  if (!next.startsWith("data:") || next.length < DATA_URL_UPLOAD_MIN) return next;

  const blob = await (await fetch(next)).blob();
  const mime = blob.type || "image/png";
  const ext = mime.includes("jpeg") || mime.includes("jpg")
    ? "jpg"
    : mime.includes("webp")
      ? "webp"
      : "png";
  const form = new FormData();
  form.append("file", blob, `design.${ext}`);
  const res = await fetch("/api/uploads/design-image", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "이미지를 저장하지 못했습니다.");
  }
  return data.url;
}

/** blob:/큰 data URL을 서버 파일로 바꿔 주문 JSON이 용량 한도를 넘지 않게 함 */
export async function embedImagesInDesignJson(
  json: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  if (!json) return null;
  if (!Array.isArray(json.objects)) return json;

  const objects = await Promise.all(
    json.objects.map(async (obj) => {
      if (!isImageObjectRecord(obj)) return obj;
      const src = obj.src;
      if (typeof src !== "string") return obj;
      if (
        src.startsWith("/uploads/") ||
        src.startsWith("http://") ||
        src.startsWith("https://")
      ) {
        return obj;
      }
      try {
        return { ...obj, src: await persistDesignImageSrc(src) };
      } catch {
        return obj;
      }
    }),
  );

  return { ...json, objects };
}

export async function embedImagesInDesignState(
  designData: DesignState,
): Promise<DesignState> {
  const next = { ...designData };

  await Promise.all(
    Object.keys(designData).map(async (side) => {
      const raw = designData[side];
      if (!raw) return;
      next[side] = (await embedImagesInDesignJson(raw)) as DesignJson;
    }),
  );

  return next;
}
