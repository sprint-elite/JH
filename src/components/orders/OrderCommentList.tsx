"use client";

import { Loader2 } from "lucide-react";
import type { OrderComment } from "@/types";

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface OrderCommentListProps {
  comments: OrderComment[];
  loading?: boolean;
  emptyMessage?: string;
  highlightAdmin?: boolean;
}

export function OrderCommentList({
  comments,
  loading,
  emptyMessage = "등록된 코멘트가 없습니다.",
  highlightAdmin = true,
}: OrderCommentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        불러오는 중…
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 px-3 py-8 text-center text-xs text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {comments.map((comment) => {
        const isAdmin = comment.authorRole === "ADMIN";
        return (
          <li
            key={comment.id}
            className={`rounded-lg border px-3 py-2.5 ${
              highlightAdmin && isAdmin
                ? "border-indigo-200 bg-indigo-50/60"
                : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-900">
                {comment.authorName}
                {isAdmin && (
                  <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                    관리자
                  </span>
                )}
              </span>
              <time className="shrink-0 text-[10px] text-zinc-400">
                {formatDate(comment.createdAt)}
              </time>
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
              {comment.message}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
