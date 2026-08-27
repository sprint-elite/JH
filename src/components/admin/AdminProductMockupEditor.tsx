"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import {
  makeMockupSideKey,
  type ProductMockupFaceDto,
} from "@/lib/product-mockup";

type FaceForm = {
  key: string;
  side: string;
  label: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  printX: number;
  printY: number;
  printW: number;
  printH: number;
};

function emptyFace(label = "새 면"): FaceForm {
  const side = makeMockupSideKey();
  return {
    key: side,
    side,
    label,
    imageUrl: "",
    imageWidth: 400,
    imageHeight: 500,
    printX: 0.15,
    printY: 0.25,
    printW: 0.7,
    printH: 0.5,
  };
}

function fromDto(dto: ProductMockupFaceDto): FaceForm {
  return {
    key: dto.id ?? dto.side,
    side: dto.side,
    label: dto.label,
    imageUrl: dto.imageUrl,
    imageWidth: dto.imageWidth,
    imageHeight: dto.imageHeight,
    printX: dto.printX,
    printY: dto.printY,
    printW: dto.printW,
    printH: dto.printH,
  };
}

interface AdminProductMockupEditorProps {
  productId: string;
}

export type AdminProductMockupEditorHandle = {
  save: () => Promise<void>;
};

export const AdminProductMockupEditor = forwardRef<
  AdminProductMockupEditorHandle,
  AdminProductMockupEditorProps
>(function AdminProductMockupEditor({ productId }, ref) {
  const [faces, setFaces] = useState<FaceForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}/mockups`);
        const data = (await res.json()) as {
          mockups?: ProductMockupFaceDto[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "목업 조회 실패");
        if (cancelled) return;
        setFaces((data.mockups ?? []).map(fromDto));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "목업 조회 실패");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const updateFace = (key: string, patch: Partial<FaceForm>) => {
    setFaces((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );
  };

  const removeFace = (key: string) => {
    setFaces((prev) => prev.filter((f) => f.key !== key));
    setMessage(null);
  };

  const addFace = () => {
    setFaces((prev) => [...prev, emptyFace(`면 ${prev.length + 1}`)]);
  };

  const upload = async (key: string, file: File) => {
    setUploadingKey(key);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "업로드 실패");

      const dims = await readImageSize(data.url).catch(() => null);
      updateFace(key, {
        imageUrl: data.url,
        ...(dims
          ? { imageWidth: dims.w, imageHeight: dims.h }
          : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploadingKey(null);
    }
  };

  const persistFaces = async (nextFaces: FaceForm[]) => {
    for (const f of nextFaces) {
      if (!f.label.trim()) {
        throw new Error("면 이름을 모두 입력해 주세요.");
      }
      if (!f.imageUrl.trim()) {
        throw new Error(`「${f.label}」면 이미지를 등록해 주세요.`);
      }
    }

    const mockups = nextFaces.map((f, i) => ({
      side: f.side,
      label: f.label.trim(),
      imageUrl: f.imageUrl.trim(),
      imageWidth: f.imageWidth || 400,
      imageHeight: f.imageHeight || 500,
      printX: f.printX,
      printY: f.printY,
      printW: f.printW,
      printH: f.printH,
      sortOrder: i,
    }));

    const res = await fetch(`/api/admin/products/${productId}/mockups`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mockups }),
    });
    const data = (await res.json()) as {
      mockups?: ProductMockupFaceDto[];
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "저장 실패");
    setFaces((data.mockups ?? []).map(fromDto));
  };

  const save = async () => {
    if (loading) {
      throw new Error("목업을 불러오는 중입니다. 잠시 후 다시 저장해 주세요.");
    }
    setError(null);
    setMessage(null);
    try {
      await persistFaces(faces);
      setMessage(
        faces.length === 0
          ? "목업을 모두 삭제했습니다."
          : "목업이 저장되었습니다.",
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "저장 실패";
      setError(msg);
      throw err;
    }
  };

  useImperativeHandle(ref, () => ({ save }), [faces, productId, loading]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        목업 불러오는 중…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">빌더 목업</p>
        <button
          type="button"
          onClick={addFace}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          면 추가
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {message && <p className="text-xs text-emerald-700">{message}</p>}

        {faces.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 text-center">
            <p className="text-sm text-slate-600">목업 면이 없습니다</p>
            <button
              type="button"
              onClick={addFace}
              className="mt-3 inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              면 추가
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {faces.map((face, index) => (
              <div
                key={face.key}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-1.5 px-2 py-1.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
                    {index + 1}
                  </span>
                  <input
                    value={face.label}
                    onChange={(e) =>
                      updateFace(face.key, { label: e.target.value })
                    }
                    className="min-w-0 flex-1 bg-transparent px-1 py-0.5 text-xs font-semibold text-slate-900 outline-none"
                    placeholder="면 이름"
                  />
                  <label className="cursor-pointer rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="sr-only">업로드</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      disabled={uploadingKey === face.key}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(face.key, file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeFace(face.key)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="bg-zinc-50 px-2 pb-2">
                  <PrintAreaEditor
                    imageUrl={face.imageUrl}
                    imageWidth={face.imageWidth}
                    imageHeight={face.imageHeight}
                    printX={face.printX}
                    printY={face.printY}
                    printW={face.printW}
                    printH={face.printH}
                    onChange={(print) => updateFace(face.key, print)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

type PrintRect = {
  printX: number;
  printY: number;
  printW: number;
  printH: number;
};

function clampPrint(rect: PrintRect): PrintRect {
  let { printX, printY, printW, printH } = rect;
  printX = Math.min(1, Math.max(0, printX));
  printY = Math.min(1, Math.max(0, printY));
  printW = Math.min(1 - printX, Math.max(0.05, printW));
  printH = Math.min(1 - printY, Math.max(0.05, printH));
  return { printX, printY, printW, printH };
}

function PrintAreaEditor({
  imageUrl,
  imageWidth,
  imageHeight,
  printX,
  printY,
  printW,
  printH,
  onChange,
}: PrintRect & {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  onChange: (rect: PrintRect) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    orig: PrintRect;
  } | null>(null);
  const labelId = useId();

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const frame = frameRef.current;
      if (!drag || !frame) return;
      const rect = frame.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dx = (e.clientX - drag.startX) / rect.width;
      const dy = (e.clientY - drag.startY) / rect.height;
      if (drag.mode === "move") {
        onChange(
          clampPrint({
            printX: drag.orig.printX + dx,
            printY: drag.orig.printY + dy,
            printW: drag.orig.printW,
            printH: drag.orig.printH,
          }),
        );
      } else {
        onChange(
          clampPrint({
            printX: drag.orig.printX,
            printY: drag.orig.printY,
            printW: drag.orig.printW + dx,
            printH: drag.orig.printH + dy,
          }),
        );
      }
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [onChange]);

  const startDrag = (
    mode: "move" | "resize",
    e: React.PointerEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { printX, printY, printW, printH },
    };
  };

  const ratio =
    imageWidth > 0 && imageHeight > 0 ? imageWidth / imageHeight : 3 / 4;

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200"
      style={{ aspectRatio: String(ratio) }}
      aria-labelledby={labelId}
    >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="pointer-events-none h-full w-full object-fill"
            draggable={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-zinc-400">
            이미지 없음
          </div>
        )}

        {imageUrl ? (
          <div
            role="presentation"
            onPointerDown={(e) => startDrag("move", e)}
            className="absolute cursor-move border-2 border-dashed border-sky-500 bg-sky-400/25"
            style={{
              left: `${printX * 100}%`,
              top: `${printY * 100}%`,
              width: `${printW * 100}%`,
              height: `${printH * 100}%`,
            }}
          >
            <span
              id={labelId}
              className="pointer-events-none absolute left-0.5 top-0.5 rounded bg-sky-600 px-1 text-[9px] font-semibold text-white"
            >
              인쇄
            </span>
            <button
              type="button"
              aria-label="인쇄 영역 크기 조절"
              onPointerDown={(e) => startDrag("resize", e)}
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-sky-600"
            />
          </div>
        ) : null}
    </div>
  );
}

function readImageSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () =>
      resolve({ w: img.naturalWidth || 400, h: img.naturalHeight || 500 });
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
}
