import type { FabricObject } from "fabric";
import type { ImageStyleState } from "@/types/image-style";

export function isImageObject(obj: FabricObject): boolean {
  return obj.type === "image";
}

export function readImageStyle(obj: FabricObject): ImageStyleState {
  return {
    left: Math.round(obj.left ?? 0),
    top: Math.round(obj.top ?? 0),
    scale: Math.round((obj.scaleX ?? 1) * 100) / 100,
    angle: Math.round(obj.angle ?? 0),
    opacity: Math.round((obj.opacity ?? 1) * 100) / 100,
  };
}

export function applyImageStylePatch(
  obj: FabricObject,
  patch: Partial<ImageStyleState>,
): void {
  const next: Record<string, unknown> = {};

  if (patch.left !== undefined) next.left = patch.left;
  if (patch.top !== undefined) next.top = patch.top;
  if (patch.angle !== undefined) next.angle = patch.angle;
  if (patch.opacity !== undefined) next.opacity = patch.opacity;
  if (patch.scale !== undefined) {
    next.scaleX = patch.scale;
    next.scaleY = patch.scale;
  }

  obj.set(next);
}
