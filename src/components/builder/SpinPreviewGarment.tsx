"use client";

import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import type { SpinPreviewFaceLayout } from "@/lib/builder/spin-preview-artwork";

type SpinPreviewMockupPlanesProps = {
  frontUrl: string | null;
  backUrl: string | null;
  frontLayout: SpinPreviewFaceLayout | null;
  backLayout: SpinPreviewFaceLayout | null;
};

const TARGET_HEIGHT = 1.75;

function planeSize(layout: SpinPreviewFaceLayout | null) {
  if (!layout) return { w: TARGET_HEIGHT * 0.75, h: TARGET_HEIGHT };
  const scale = TARGET_HEIGHT / layout.height;
  return { w: layout.width * scale, h: layout.height * scale };
}

export function SpinPreviewMockupPlanes({
  frontUrl,
  backUrl,
  frontLayout,
  backLayout,
}: SpinPreviewMockupPlanesProps) {
  const frontSrc = frontUrl ?? backUrl!;
  const backSrc = backUrl ?? frontUrl!;

  const frontMap = useTexture(frontSrc);
  const backMap = useTexture(backSrc);

  const frontSize = useMemo(
    () => planeSize(frontLayout ?? backLayout),
    [frontLayout, backLayout],
  );
  const backSize = useMemo(
    () => planeSize(backLayout ?? frontLayout),
    [backLayout, frontLayout],
  );

  return (
    <group position={[0, 0.02, 0]}>
      {frontUrl && (
        <mesh position={[0, 0, 0.004]}>
          <planeGeometry args={[frontSize.w, frontSize.h]} />
          <meshBasicMaterial
            map={frontMap}
            transparent
            toneMapped={false}
            depthWrite
          />
        </mesh>
      )}
      {backUrl && (
        <mesh position={[0, 0, -0.004]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[backSize.w, backSize.h]} />
          <meshBasicMaterial
            map={backMap}
            transparent
            toneMapped={false}
            depthWrite
          />
        </mesh>
      )}
    </group>
  );
}
