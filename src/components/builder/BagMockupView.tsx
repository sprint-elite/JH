"use client";

import type { CSSProperties } from "react";
import { getBagColorPreset, type BagColorPreset } from "@/lib/fabric/bag-colors";
import type { MockupPlacement } from "@/lib/fabric/mockup-builder";
import type { BagColorOption } from "@/types/builder";

interface BagMockupViewProps {
  placement: MockupPlacement;
  bagColor: BagColorOption;
  handleStrapColor?: BagColorOption;
}

function PhotoAlphaTintLayer({
  preset,
  mockupSrc,
}: {
  preset: BagColorPreset;
  mockupSrc: string;
}) {
  if (preset.isNatural) return null;

  const style: CSSProperties = {
    backgroundColor: preset.hex,
    mixBlendMode: preset.blendMode,
    opacity: preset.opacity,
    WebkitMaskImage: `url(${mockupSrc})`,
    WebkitMaskSize: "100% 100%",
    WebkitMaskRepeat: "no-repeat",
    maskImage: `url(${mockupSrc})`,
    maskSize: "100% 100%",
    maskRepeat: "no-repeat",
    maskMode: "alpha",
  };

  return (
    <div className="pointer-events-none absolute inset-0" style={style} />
  );
}

export function BagMockupView({
  placement,
  bagColor,
  handleStrapColor = "cream",
}: BagMockupViewProps) {
  const bodyPreset = getBagColorPreset(bagColor);
  const handlePreset = getBagColorPreset(handleStrapColor);
  const { mockupSrc, bodyMaskSrc, handleMaskSrc } = placement;
  const useSplitLayers = Boolean(bodyMaskSrc && handleMaskSrc);

  return (
    <div
      className="absolute"
      style={{
        left: placement.imgLeft,
        top: placement.imgTop,
        width: placement.imgWidth,
        height: placement.imgHeight,
        isolation: "isolate",
        filter: "drop-shadow(0 10px 22px rgba(24,24,27,0.22))",
      }}
    >
      {useSplitLayers ? (
        <>
          <img
            src={bodyMaskSrc!}
            alt=""
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain"
          />
          <PhotoAlphaTintLayer preset={bodyPreset} mockupSrc={bodyMaskSrc!} />
          <img
            src={handleMaskSrc!}
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
          />
          <PhotoAlphaTintLayer preset={handlePreset} mockupSrc={handleMaskSrc!} />
        </>
      ) : (
        <>
          <img
            src={mockupSrc}
            alt=""
            draggable={false}
            className="pointer-events-none block h-full w-full select-none object-contain"
          />
          <PhotoAlphaTintLayer preset={bodyPreset} mockupSrc={mockupSrc} />
        </>
      )}
    </div>
  );
}
