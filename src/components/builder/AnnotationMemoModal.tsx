"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useBuilderStore } from "@/store";

export function AnnotationMemoModal() {
  const pendingPin = useBuilderStore((s) => s.pendingPin);
  const editingId = useBuilderStore((s) => s.editingAnnotationId);
  const annotations = useBuilderStore((s) => s.annotations);
  const addAnnotation = useBuilderStore((s) => s.addAnnotation);
  const updateAnnotation = useBuilderStore((s) => s.updateAnnotation);
  const setPendingPin = useBuilderStore((s) => s.setPendingPin);
  const setEditingAnnotationId = useBuilderStore((s) => s.setEditingAnnotationId);

  const editing = editingId
    ? annotations.find((a) => a.id === editingId)
    : null;

  const open = !!pendingPin || !!editing;
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setMessage(editing.message);
    } else {
      setTitle("");
      setMessage("");
    }
  }, [editing, pendingPin, editingId]);

  if (!open) return null;

  const close = () => {
    setPendingPin(null);
    setEditingAnnotationId(null);
    setTitle("");
    setMessage("");
  };

  const submit = () => {
    if (!title.trim() || !message.trim()) return;

    if (editing) {
      updateAnnotation(editing.id, {
        title: title.trim(),
        message: message.trim(),
      });
    } else if (pendingPin) {
      addAnnotation({
        side: pendingPin.side,
        x: pendingPin.x,
        y: pendingPin.y,
        title: title.trim(),
        message: message.trim(),
      });
    }
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-zinc-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h3 className="text-sm font-semibold">
            {editing ? "주석 수정" : "메모 입력"}
          </h3>
          <button
            type="button"
            onClick={close}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <label className="mb-1 block text-xs text-zinc-400">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 로고 위치 수정"
              className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="수정 요청 내용을 입력하세요"
              className="w-full resize-none rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-zinc-700 px-4 py-3">
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim() || !message.trim()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40"
          >
            {editing ? "저장" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
