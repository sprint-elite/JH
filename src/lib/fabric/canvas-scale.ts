import type { DesignJson, MockupOffset } from "@/types/builder";
import type { FabricObject } from "fabric";
import { isTextObject } from "./text-style-utils";

export function getCanvasScale(
  designJson: DesignJson | null | undefined,
  canvasW: number,
  canvasH: number,
) {
  const savedW =
    typeof designJson?.canvasWidth === "number"
      ? designJson.canvasWidth
      : canvasW;
  const savedH =
    typeof designJson?.canvasHeight === "number"
      ? designJson.canvasHeight
      : canvasH;

  return {
    scaleX: savedW > 0 ? canvasW / savedW : 1,
    scaleY: savedH > 0 ? canvasH / savedH : 1,
  };
}

export function scaleMockupOffset(
  offset: MockupOffset,
  scaleX: number,
  scaleY: number,
): MockupOffset {
  if (scaleX === 1 && scaleY === 1) return offset;
  return { x: offset.x * scaleX, y: offset.y * scaleY };
}

export function scaleFabricObject(
  obj: FabricObject,
  scaleX: number,
  scaleY: number,
) {
  if (scaleX === 1 && scaleY === 1) return;

  if (isTextObject(obj)) {
    const fontSize = (obj as { fontSize?: number }).fontSize;
    obj.set({
      left: (obj.left ?? 0) * scaleX,
      top: (obj.top ?? 0) * scaleY,
      fontSize:
        typeof fontSize === "number"
          ? fontSize * Math.min(scaleX, scaleY)
          : fontSize,
    });
  } else {
    obj.set({
      left: (obj.left ?? 0) * scaleX,
      top: (obj.top ?? 0) * scaleY,
      scaleX: (obj.scaleX ?? 1) * scaleX,
      scaleY: (obj.scaleY ?? 1) * scaleY,
    });
  }

  obj.setCoords();
}
