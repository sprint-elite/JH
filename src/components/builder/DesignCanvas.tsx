"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createBagCanvas, type BagCanvasHandle } from "@/lib/fabric/bag-canvas";
import { BagMockupView } from "./BagMockupView";
import { PrintAreaGuide } from "./PrintAreaGuide";
import {
  computeMockupPlacement,
  photoMockupFromDbFace,
} from "@/lib/fabric/mockup-builder";
import {
  getCanvasScale,
  scaleMockupOffset,
} from "@/lib/fabric/canvas-scale";
import { useBuilderStore } from "@/store";
import { useBuilderProduct } from "./BuilderProductContext";
import type { BuilderOptions, DesignJson, ViewSide } from "@/types/builder";
import type { CanvasSelectionState, TextStyleState } from "@/types/text-style";
import type { ImageStyleState } from "@/types/image-style";

export type DesignCanvasRef = BagCanvasHandle & {
  switchSide: (side: ViewSide, json: DesignJson | null) => Promise<void>;
};

interface DesignCanvasProps {
  options: BuilderOptions;
  side: ViewSide;
  designJson: DesignJson | null;
  onReady?: () => void;
  onDimsChange?: (dims: { w: number; h: number }) => void;
  onDesignChange?: () => void;
  onSelectionChange?: (state: CanvasSelectionState) => void;
  annotationMode?: boolean;
  onAnnotationPlace?: (x: number, y: number) => void;
  /** 상품 상세 임베드 빌더: 인쇄 영역 점선 표시 */
  showPrintAreaGuide?: boolean;
}

export const DesignCanvas = forwardRef<DesignCanvasRef, DesignCanvasProps>(
  function DesignCanvas(
    { options, side, designJson, onReady, onDimsChange, onDesignChange, onSelectionChange, annotationMode, onAnnotationPlace, showPrintAreaGuide = false },
    ref,
  ) {
    const mockupOffset = useBuilderStore(
      (s) => s.mockupOffsets[side] ?? { x: 0, y: 0 },
    );
    const setMockupOffset = useBuilderStore((s) => s.setMockupOffset);
    const nudgeAnnotationsOnSide = useBuilderStore((s) => s.nudgeAnnotationsOnSide);
    const productContext = useBuilderProduct();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const handleRef = useRef<BagCanvasHandle | null>(null);
    const onReadyRef = useRef(onReady);
    const optionsRef = useRef(options);
    const sideRef = useRef(side);
    const designJsonRef = useRef(designJson);
    const prevSideRef = useRef<ViewSide>(side);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const onDimsChangeRef = useRef(onDimsChange);
    const onDesignChangeRef = useRef(onDesignChange);
    const onSelectionChangeRef = useRef(onSelectionChange);
    onDimsChangeRef.current = onDimsChange;
    onDesignChangeRef.current = onDesignChange;
    onSelectionChangeRef.current = onSelectionChange;

    onReadyRef.current = onReady;
    optionsRef.current = options;
    sideRef.current = side;
    designJsonRef.current = designJson;

    const mockupKey = `${options.productType}-${options.size}-${options.fabric}-${options.bagColor}-${options.handleStrapColor}-${options.handle}-${options.pocket}-${side}`;

    const dbFace = useMemo(() => {
      const faces = productContext?.mockupFaces ?? [];
      return faces.find((f) => f.side === side) ?? null;
    }, [productContext?.mockupFaces, side]);

    const placement = useMemo(() => {
      if (dims.w < 100 || dims.h < 100) return null;
      const { scaleX, scaleY } = getCanvasScale(designJson, dims.w, dims.h);
      const offset = scaleMockupOffset(mockupOffset, scaleX, scaleY);
      const photoOverride = dbFace
        ? photoMockupFromDbFace(dbFace, options.productType, side)
        : null;
      return computeMockupPlacement(
        dims.w,
        dims.h,
        options,
        side,
        offset,
        photoOverride,
      );
    }, [
      dims.w,
      dims.h,
      options,
      side,
      mockupKey,
      mockupOffset.x,
      mockupOffset.y,
      designJson,
      dbFace,
    ]);

    useImperativeHandle(ref, () => ({
      exportJson: () => handleRef.current?.exportJson() ?? { objects: [] },
      importJson: async (json) => {
        await handleRef.current?.importJson(json);
      },
      addText: (text?: string) => handleRef.current?.addText(text),
      addImageFromFile: async (file: File) => {
        await handleRef.current?.addImageFromFile(file);
      },
      deleteSelected: () => handleRef.current?.deleteSelected(),
      bringForward: () => handleRef.current?.bringForward(),
      sendBackward: () => handleRef.current?.sendBackward(),
      flipHorizontal: () => handleRef.current?.flipHorizontal(),
      flipVertical: () => handleRef.current?.flipVertical(),
      getLayers: () => handleRef.current?.getLayers() ?? [],
      selectLayer: (i: number) => handleRef.current?.selectLayer(i),
      moveLayerUp: (i: number) => handleRef.current?.moveLayerUp(i),
      moveLayerDown: (i: number) => handleRef.current?.moveLayerDown(i),
      deleteLayer: (i: number) => handleRef.current?.deleteLayer(i),
      clearDesign: () => handleRef.current?.clearDesign(),
      updateMockup: (opts, s, offset) =>
        handleRef.current?.updateMockup(opts, s, offset),
      undo: () => handleRef.current?.undo(),
      redo: () => handleRef.current?.redo(),
      focus: () => handleRef.current?.focus(),
      getJsonString: () => handleRef.current?.getJsonString() ?? "{}",
      checkOutOfBounds: () => handleRef.current?.checkOutOfBounds() ?? false,
      dispose: () => handleRef.current?.dispose(),
      getSelectionState: () =>
        handleRef.current?.getSelectionState() ?? { kind: "none" },
      updateTextStyle: (patch: Partial<TextStyleState>) =>
        handleRef.current?.updateTextStyle(patch),
      updateImageStyle: (patch: Partial<ImageStyleState>) =>
        handleRef.current?.updateImageStyle(patch),
      nudgeSelected: (dx: number, dy: number) =>
        handleRef.current?.nudgeSelected(dx, dy),
      centerSelected: () => handleRef.current?.centerSelected(),
      switchSide: async (newSide, json) => {
        if (!handleRef.current) return;
        const offset = useBuilderStore.getState().mockupOffsets[newSide];
        handleRef.current.updateMockup(optionsRef.current, newSide, offset);
        await handleRef.current.importJson(json);
      },
    }));

    useEffect(() => {
      const container = wrapperRef.current;
      if (!container) return;

      const ro = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const w = Math.floor(entry.contentRect.width);
        const h = Math.floor(entry.contentRect.height);
        if (w > 100 && h > 100) {
          setDims((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
        }
      });
      ro.observe(container);
      return () => ro.disconnect();
    }, []);

    useEffect(() => {
      if (dims.w > 100 && dims.h > 100) {
        onDimsChangeRef.current?.(dims);
      }
    }, [dims.w, dims.h]);

    const fabricMountKey = `${dims.w}x${dims.h}-${dbFace?.printX ?? ""}-${dbFace?.printY ?? ""}-${dbFace?.printW ?? ""}-${dbFace?.printH ?? ""}-${dbFace?.imageUrl ?? ""}`;

    useEffect(() => {
      const el = canvasElRef.current;
      if (!el || dims.w < 100 || dims.h < 100) return;

      let cancelled = false;
      setReady(false);
      setError(null);

      createBagCanvas(
        el,
        dims.w,
        dims.h,
        optionsRef.current,
        sideRef.current,
        () => onDesignChangeRef.current?.(),
        (state) => onSelectionChangeRef.current?.(state),
        (offset) => setMockupOffset(sideRef.current, offset),
        (dx, dy, dragSide) => {
          nudgeAnnotationsOnSide(dragSide, dx / dims.w, dy / dims.h);
        },
        (viewSide) => {
          const face = productContext?.mockupFaces?.find(
            (f) => f.side === viewSide,
          );
          if (!face) return null;
          return photoMockupFromDbFace(
            face,
            optionsRef.current.productType,
            viewSide,
          );
        },
      )
        .then(async ({ handle }) => {
          if (cancelled) {
            handle.dispose();
            return;
          }
          handleRef.current = handle;
          const json = designJsonRef.current;
          if (json) {
            await handle.importJson(json);
          }
          setReady(true);
          onReadyRef.current?.();
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : "캔버스 초기화 실패",
            );
          }
        });

      return () => {
        cancelled = true;
        handleRef.current?.dispose();
        handleRef.current = null;
        setReady(false);
        onSelectionChangeRef.current?.({ kind: "none" });
      };
    }, [fabricMountKey]);

    useEffect(() => {
      if (!handleRef.current || !ready) return;
      const { scaleX, scaleY } = getCanvasScale(designJson, dims.w, dims.h);
      const offset = scaleMockupOffset(mockupOffset, scaleX, scaleY);
      handleRef.current.updateMockup(options, side, offset);
    }, [mockupKey, ready, options, side, mockupOffset.x, mockupOffset.y, designJson, dims.w, dims.h]);

    useEffect(() => {
      if (!handleRef.current || !ready) return;
      void handleRef.current.importJson(designJson);
      prevSideRef.current = side;
    }, [side, designJson, ready]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!handleRef.current) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleRef.current.undo();
        return;
      }
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRef.current.redo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const active = document.activeElement;
        if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;
        if ((active as HTMLElement)?.contentEditable === "true") return;
        e.preventDefault();
        handleRef.current.deleteSelected();
        return;
      }

      const active = document.activeElement;
      if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA") return;

      const step = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleRef.current.nudgeSelected(-step, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleRef.current.nudgeSelected(step, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        handleRef.current.nudgeSelected(0, -step);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleRef.current.nudgeSelected(0, step);
      }
    };

    const showMockup =
      placement?.usePhoto && placement.mockupSrc && placement.mockupSrc.length > 0;

    return (
      <div
        ref={wrapperRef}
        tabIndex={0}
        role="application"
        aria-label="디자인 캔버스"
        onKeyDown={handleKeyDown}
        onMouseDown={() => wrapperRef.current?.focus()}
        onClick={(e) => {
          if (!annotationMode || !onAnnotationPlace || !wrapperRef.current) return;
          const rect = wrapperRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          onAnnotationPlace(x, y);
        }}
        className={`relative h-full min-h-0 w-full overflow-visible bg-[#f5f5f5] outline-none ${
          annotationMode ? "cursor-crosshair" : ""
        }`}
      >
        {/* 목업 레이어 — Fabric과 DOM 분리 */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          {showMockup && placement && (
            <BagMockupView
              key={side}
              placement={placement}
              bagColor={options.bagColor ?? "cream"}
              handleStrapColor={options.handleStrapColor}
            />
          )}
        </div>

        {/* Fabric 전용 호스트 — canvas만 포함, Fabric이 DOM 조작해도 React와 충돌 없음 */}
        {dims.w > 0 && dims.h > 0 && (
          <div
            key={fabricMountKey}
            className={`absolute inset-0 z-10 ${annotationMode ? "pointer-events-none" : ""}`}
            style={{ width: dims.w, height: dims.h }}
          >
            <canvas
              ref={canvasElRef}
              width={dims.w}
              height={dims.h}
              style={{ width: dims.w, height: dims.h, display: "block" }}
            />
          </div>
        )}

        {showPrintAreaGuide && placement && dims.w > 0 && (
          <PrintAreaGuide placement={placement} />
        )}

        {!ready && !error && dims.w > 0 && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#f5f5f5]/80 text-sm text-zinc-500">
            캔버스 로딩 중…
          </div>
        )}
        {error && (
          <div className="absolute bottom-2 left-2 right-2 z-30 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  },
);
