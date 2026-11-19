import { renderArtworkPng } from "@/lib/fabric/export-artwork";
import { getBagColorPreset, type BagColorPreset } from "@/lib/fabric/bag-colors";
import {
  getPhotoMockup,
  photoMockupFromDbFace,
  type PhotoMockup,
} from "@/lib/fabric/mockup-builder";
import type { ProductMockupFaceDto } from "@/lib/product-mockup";
import type {
  BuilderOptions,
  DesignJson,
  DesignState,
  MockupOffset,
  MockupOffsetState,
  ViewSide,
} from "@/types/builder";
import { DEFAULT_MOCKUP_OFFSET } from "@/types/builder";

export type SpinPreviewFaceLayout = {
  width: number;
  height: number;
};

export type SpinPreviewTextures = {
  frontUrl: string | null;
  backUrl: string | null;
  frontLayout: SpinPreviewFaceLayout | null;
  backLayout: SpinPreviewFaceLayout | null;
};

function mockupOffsetFor(
  mockupOffsets: MockupOffsetState,
  side: ViewSide,
): MockupOffset {
  return mockupOffsets[side] ?? mockupOffsets.front ?? DEFAULT_MOCKUP_OFFSET.front;
}

function pickFrontBackSides(sides: ViewSide[]): {
  front: ViewSide | null;
  back: ViewSide | null;
} {
  if (sides.length === 0) return { front: null, back: null };
  const front =
    sides.find((s) => s === "front") ??
    sides.find((s) => /앞|front/i.test(s)) ??
    sides[0] ??
    null;
  const back =
    sides.find((s) => s === "back") ??
    sides.find((s) => /뒤|back/i.test(s)) ??
    (sides.length > 1 ? sides[1] : null);
  return { front, back };
}

function resolvePhotoMockup(
  options: BuilderOptions,
  side: ViewSide,
  mockupFaces: ProductMockupFaceDto[],
): PhotoMockup | null {
  const face = mockupFaces.find((f) => f.side === side);
  if (face) return photoMockupFromDbFace(face, options.productType, side);
  return getPhotoMockup(options.productType, side);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image load failed: ${src}`));
    img.src = src;
  });
}

/** 인쇄 영역에 비율 유지(contain)로 합성 — 텍스트 납작함 방지 */
function drawArtworkInPrintRect(
  ctx: CanvasRenderingContext2D,
  artImg: HTMLImageElement,
  px: number,
  py: number,
  pw: number,
  ph: number,
) {
  const srcAspect = artImg.width / artImg.height;
  const dstAspect = pw / ph;
  let dw = pw;
  let dh = ph;
  let dx = px;
  let dy = py;
  if (Math.abs(srcAspect - dstAspect) > 0.02) {
    if (srcAspect > dstAspect) {
      dh = pw / srcAspect;
      dy = py + (ph - dh) / 2;
    } else {
      dw = ph * srcAspect;
      dx = px + (pw - dw) / 2;
    }
  }
  ctx.drawImage(artImg, 0, 0, artImg.width, artImg.height, dx, dy, dw, dh);
}

function canvasBlendMode(preset: BagColorPreset): GlobalCompositeOperation {
  switch (preset.blendMode) {
    case "multiply":
      return "multiply";
    case "soft-light":
      return "soft-light";
    default:
      return "color";
  }
}

function applyGarmentTint(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  preset: BagColorPreset,
  mockupImg: HTMLImageElement,
) {
  if (preset.isNatural) return;
  ctx.save();
  ctx.globalCompositeOperation = canvasBlendMode(preset);
  ctx.globalAlpha = preset.opacity;
  ctx.fillStyle = preset.hex;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "destination-in";
  ctx.globalAlpha = 1;
  ctx.drawImage(mockupImg, 0, 0, w, h);
  ctx.restore();
}

async function renderMockupFaceComposite(
  options: BuilderOptions,
  side: ViewSide,
  designJson: DesignJson | null,
  mockupOffset: MockupOffset,
  photo: PhotoMockup,
): Promise<Blob> {
  const w = photo.width;
  const h = photo.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d unavailable");

  const mockupImg = await loadImage(photo.src);
  ctx.drawImage(mockupImg, 0, 0, w, h);
  applyGarmentTint(ctx, w, h, getBagColorPreset(options.bagColor), mockupImg);

  const artwork = await renderArtworkPng(
    designJson,
    options,
    side,
    mockupOffset,
    undefined,
    photo,
  );
  if (artwork) {
    const artUrl = URL.createObjectURL(artwork.blob);
    try {
      const artImg = await loadImage(artUrl);
      const px = photo.print.x * w;
      const py = photo.print.y * h;
      const pw = photo.print.w * w;
      const ph = photo.print.h * h;
      drawArtworkInPrintRect(ctx, artImg, px, py, pw, ph);
    } finally {
      URL.revokeObjectURL(artUrl);
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("composite blob failed"));
    }, "image/png");
  });
}

async function compositeSide(
  options: BuilderOptions,
  side: ViewSide,
  designData: DesignState,
  mockupOffsets: MockupOffsetState,
  mockupFaces: ProductMockupFaceDto[],
): Promise<{ url: string; layout: SpinPreviewFaceLayout } | null> {
  const photo = resolvePhotoMockup(options, side, mockupFaces);
  if (!photo) return null;

  const blob = await renderMockupFaceComposite(
    options,
    side,
    designData[side] ?? null,
    mockupOffsetFor(mockupOffsets, side),
    photo,
  );
  return {
    url: URL.createObjectURL(blob),
    layout: { width: photo.width, height: photo.height },
  };
}

/** 상품 목업 PNG + 색상 + 인쇄 합성 (모달 닫을 때 revoke) */
export async function prepareSpinPreviewTextures(
  options: BuilderOptions,
  designData: DesignState,
  sides: ViewSide[],
  mockupOffsets: MockupOffsetState,
  mockupFaces: ProductMockupFaceDto[],
): Promise<SpinPreviewTextures> {
  const { front, back } = pickFrontBackSides(sides);

  let frontUrl: string | null = null;
  let backUrl: string | null = null;
  let frontLayout: SpinPreviewFaceLayout | null = null;
  let backLayout: SpinPreviewFaceLayout | null = null;

  if (front) {
    const result = await compositeSide(
      options,
      front,
      designData,
      mockupOffsets,
      mockupFaces,
    );
    if (result) {
      frontUrl = result.url;
      frontLayout = result.layout;
    }
  }

  if (back && back !== front) {
    const result = await compositeSide(
      options,
      back,
      designData,
      mockupOffsets,
      mockupFaces,
    );
    if (result) {
      backUrl = result.url;
      backLayout = result.layout;
    }
  }

  if (!frontUrl && !backUrl) {
    throw new Error("no mockup faces");
  }

  return { frontUrl, backUrl, frontLayout, backLayout };
}

export function revokeSpinPreviewTextures(textures: SpinPreviewTextures) {
  if (textures.frontUrl) URL.revokeObjectURL(textures.frontUrl);
  if (textures.backUrl) URL.revokeObjectURL(textures.backUrl);
}
