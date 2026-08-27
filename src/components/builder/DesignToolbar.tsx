"use client";

import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eraser,
  ImagePlus,
  Save,
  Trash2,
  Type,
  FileJson,
} from "lucide-react";
import type { DesignCanvasRef } from "./DesignCanvas";

interface DesignToolbarProps {
  canvasRef: React.RefObject<DesignCanvasRef | null>;
  onSaveCurrentSide: () => void;
  onShowJson: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function DesignToolbar({
  canvasRef,
  onSaveCurrentSide,
  onShowJson,
  onClear,
  disabled,
}: DesignToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2 py-1">
      <T icon={<Type className="h-3.5 w-3.5" />} label="텍스트" disabled={disabled} onClick={() => canvasRef.current?.addText()} />
      <T icon={<ImagePlus className="h-3.5 w-3.5" />} label="이미지" disabled={disabled} onClick={() => fileInputRef.current?.click()} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) void canvasRef.current?.addImageFromFile(f);
        e.target.value = "";
      }} />
      <T icon={<Trash2 className="h-3.5 w-3.5" />} label="삭제" disabled={disabled} onClick={() => canvasRef.current?.deleteSelected()} />
      <T icon={<ArrowUp className="h-3.5 w-3.5" />} label="앞으로" disabled={disabled} onClick={() => canvasRef.current?.bringForward()} />
      <T icon={<ArrowDown className="h-3.5 w-3.5" />} label="뒤로" disabled={disabled} onClick={() => canvasRef.current?.sendBackward()} />
      <T icon={<Eraser className="h-3.5 w-3.5" />} label="초기화" disabled={disabled} onClick={onClear} />
      <T icon={<Save className="h-3.5 w-3.5" />} label="면저장" disabled={disabled} onClick={onSaveCurrentSide} primary />
      <T icon={<FileJson className="h-3.5 w-3.5" />} label="JSON" disabled={disabled} onClick={onShowJson} />
    </div>
  );
}

function T({
  icon,
  label,
  onClick,
  disabled,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium disabled:opacity-40 ${
        primary
          ? "bg-blue-600 text-white hover:bg-blue-700"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
