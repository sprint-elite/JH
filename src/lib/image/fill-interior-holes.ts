/** 로고 안쪽 구멍(글자 녹아웃)을 불투명 픽셀로 메움. 바깥 투명은 유지. */

export type RgbaFill = { r: number; g: number; b: number; a: number };

const WHITE_FILL: RgbaFill = { r: 255, g: 255, b: 255, a: 255 };

export function fillInteriorHolesRgba(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  fill: RgbaFill = WHITE_FILL,
  alphaCut = 24,
): number {
  const n = width * height;
  if (n < 4) return 0;

  const exterior = new Uint8Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let head = 0;
  let tail = 0;

  const isHoleCandidate = (i: number) => data[i * 4 + 3] < alphaCut;

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (exterior[i] || !isHoleCandidate(i)) return;
    exterior[i] = 1;
    qx[tail] = x;
    qy[tail] = y;
    tail += 1;
  };

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (head < tail) {
    const x = qx[head];
    const y = qy[head];
    head += 1;
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  let filled = 0;
  for (let i = 0; i < n; i++) {
    if (exterior[i] || !isHoleCandidate(i)) continue;
    const o = i * 4;
    data[o] = fill.r;
    data[o + 1] = fill.g;
    data[o + 2] = fill.b;
    data[o + 3] = fill.a;
    filled += 1;
  }
  return filled;
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("이미지를 읽지 못했습니다."));
    el.src = src;
  });
}

/** 브라우저에서 이미지 src의 안쪽 투명 구멍을 흰색으로 메운 data URL 반환 */
export async function fillInteriorHolesFromSrc(src: string): Promise<string> {
  if (typeof document === "undefined" || !src) return src;
  if (src.startsWith("data:image/svg")) return src;

  const img = await loadHtmlImage(src);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  if (canvas.width < 2 || canvas.height < 2) return src;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return src;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filled = fillInteriorHolesRgba(
    imageData.data,
    canvas.width,
    canvas.height,
  );
  if (filled === 0) return src;

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export const fillInteriorHolesInDataUrl = fillInteriorHolesFromSrc;
