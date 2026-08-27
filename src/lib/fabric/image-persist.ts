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

/** blob: 임시 URL을 data URL로 치환 (주문·디자인 저장용) */
export async function embedImagesInDesignJson(
  json: Record<string, unknown> | null,
): Promise<Record<string, unknown> | null> {
  if (!json) return null;
  if (!Array.isArray(json.objects)) return json;

  const objects = await Promise.all(
    json.objects.map(async (obj) => {
      if (!isImageObjectRecord(obj)) return obj;
      const src = obj.src;
      if (typeof src !== "string" || src.startsWith("data:")) return obj;

      if (src.startsWith("blob:")) {
        try {
          const dataUrl = await blobUrlToDataUrl(src);
          return { ...obj, src: dataUrl };
        } catch {
          return obj;
        }
      }

      return obj;
    }),
  );

  return { ...json, objects };
}

export async function embedImagesInDesignState(
  designData: DesignState,
): Promise<DesignState> {
  const sides = ["front", "back", "side"] as const;
  const next = { ...designData };

  await Promise.all(
    sides.map(async (side) => {
      const raw = designData[side];
      if (!raw) return;
      next[side] = (await embedImagesInDesignJson(raw)) as DesignJson;
    }),
  );

  return next;
}
