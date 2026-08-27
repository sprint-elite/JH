"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface OrderCommentFormProps {
  onSubmit: (message: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
}

export function OrderCommentForm({
  onSubmit,
  placeholder = "코멘트를 입력하세요…",
  submitLabel = "등록",
  disabled,
}: OrderCommentFormProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = message.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-zinc-100 bg-white p-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={placeholder}
        rows={3}
        disabled={disabled || submitting}
        className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none disabled:opacity-50"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        disabled={disabled || submitting || !message.trim()}
        onClick={() => void handleSubmit()}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        <Send className="h-3.5 w-3.5" />
        {submitting ? "등록 중…" : submitLabel}
      </button>
    </div>
  );
}
