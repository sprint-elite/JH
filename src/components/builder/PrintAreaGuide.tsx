import type { MockupPlacement } from "@/lib/fabric/mockup-builder";

interface PrintAreaGuideProps {
  placement: MockupPlacement;
}

/** 인쇄 가능 영역 — 점선 오버레이 (클릭 통과) */
export function PrintAreaGuide({ placement }: PrintAreaGuideProps) {
  const { left, top, width, height } = placement.printArea;

  if (width < 8 || height < 8) return null;

  return (
    <div
      className="pointer-events-none absolute z-[15]"
      style={{ left, top, width, height }}
      aria-hidden
    >
      <div className="absolute inset-0 rounded-[2px] border-2 border-dashed border-sky-500/90 bg-sky-400/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)]" />
      <span className="absolute -top-px left-2 -translate-y-full rounded-md bg-sky-500 px-2 py-0.5 text-[10px] font-semibold tracking-tight text-white shadow-sm">
        인쇄 영역
      </span>
    </div>
  );
}
