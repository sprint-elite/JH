import type { DesignJson, MockupOffset } from "@/types/builder";
import type { FabricObject } from "fabric";
import { bakeTextObjectScale, isTextObject } from "./text-style-utils";

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

  const canvasUniform = Math.min(scaleX, scaleY);

  if (isTextObject(obj)) {
    const sx = obj.scaleX ?? 1;
    const sy = obj.scaleY ?? 1;
    const transformScale = Math.sqrt(sx * sy);
    const fontSize = (obj as { fontSize?: number }).fontSize;
    obj.set({
      left: (obj.left ?? 0) * scaleX,
      top: (obj.top ?? 0) * scaleY,
      fontSize:
        typeof fontSize === "number"
          ? fontSize * canvasUniform * transformScale
          : fontSize,
      scaleX: 1,
      scaleY: 1,
    });
  } else {
    obj.set({
      left: (obj.left ?? 0) * scaleX,
      top: (obj.top ?? 0) * scaleY,
      scaleX: (obj.scaleX ?? 1) * canvasUniform,
      scaleY: (obj.scaleY ?? 1) * canvasUniform,
    });
  }

  obj.setCoords();
}
