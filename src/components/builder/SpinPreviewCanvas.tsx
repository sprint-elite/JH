"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { SpinPreviewMockupPlanes } from "./SpinPreviewGarment";
import type { SpinPreviewFaceLayout } from "@/lib/builder/spin-preview-artwork";

type SpinPreviewCanvasProps = {
  frontUrl: string | null;
  backUrl: string | null;
  frontLayout: SpinPreviewFaceLayout | null;
  backLayout: SpinPreviewFaceLayout | null;
};

export function SpinPreviewCanvas({
  frontUrl,
  backUrl,
  frontLayout,
  backLayout,
}: SpinPreviewCanvasProps) {
  return (
    <Canvas
      className="h-full w-full touch-none"
      dpr={[1, 2]}
      camera={{ position: [0, 0.15, 2.75], fov: 42, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#f4f4f5"]} />
      <ambientLight intensity={0.85} />
      <SpinPreviewMockupPlanes
        frontUrl={frontUrl}
        backUrl={backUrl}
        frontLayout={frontLayout}
        backLayout={backLayout}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={4.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0.05, 0]}
        makeDefault
      />
    </Canvas>
  );
}
