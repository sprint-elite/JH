"use client";

import { useRef } from "react";
import {
  ImagePlus,
  Type,
  Trash2,
  Undo2,
  Redo2,
  Layers,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";

interface EditorToolRailProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  disabled?: boolean;
}

export function EditorToolRail({ canvasRef, disabled }: EditorToolRailProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-zinc-200 bg-white py-3">
      <RailBtn
        icon={<ImagePlus className="h-5 w-5" />}
        label="이미지"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
        highlight
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void canvasRef.current?.addImageFromFile(f);
          e.target.value = "";
        }}
      />
      <RailBtn
        icon={<Type className="h-5 w-5" />}
        label="텍스트"
        disabled={disabled}
        onClick={() => canvasRef.current?.addText()}
      />
      <RailBtn
        icon={<Trash2 className="h-5 w-5" />}
        label="삭제"
        disabled={disabled}
        onClick={() => canvasRef.current?.deleteSelected()}
      />
      <div className="my-2 h-px w-8 bg-zinc-200" />
      <RailBtn
        icon={<Undo2 className="h-5 w-5" />}
        label="실행취소"
        disabled={disabled}
        onClick={() => canvasRef.current?.undo()}
      />
      <RailBtn
        icon={<Redo2 className="h-5 w-5" />}
        label="다시실행"
        disabled={disabled}
        onClick={() => canvasRef.current?.redo()}
      />
      <RailBtn
        icon={<Layers className="h-5 w-5" />}
        label="앞으로"
        disabled={disabled}
        onClick={() => canvasRef.current?.bringForward()}
      />
    </div>
  );
}

function RailBtn({
  icon,
  label,
  onClick,
  disabled,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={label}
      onClick={onClick}
      className={`flex h-11 w-11 flex-col items-center justify-center rounded-lg transition-colors disabled:opacity-30 ${
        highlight
          ? "bg-zinc-900 text-white hover:bg-zinc-800"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {icon}
    </button>
  );
}
