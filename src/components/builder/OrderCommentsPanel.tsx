"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { OrderCommentForm } from "@/components/orders/OrderCommentForm";
import { OrderCommentList } from "@/components/orders/OrderCommentList";
import type { OrderComment } from "@/types";

interface OrderCommentsPanelProps {
  orderId: string | null;
  orderNumber?: string;
  canPost?: boolean;
}

export function OrderCommentsPanel({
  orderId,
  orderNumber,
  canPost = true,
}: OrderCommentsPanelProps) {
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${id}/comments`);
      const data = (await res.json()) as {
        comments?: OrderComment[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "코멘트를 불러오지 못했습니다.");
      setComments(data.comments ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로드 실패");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setComments([]);
      setError(null);
      return;
    }
    void loadComments(orderId);
  }, [orderId, loadComments]);

  const handlePost = async (message: string) => {
    if (!orderId) return;

    const res = await fetch(`/api/orders/${orderId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = (await res.json()) as {
      comment?: OrderComment;
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "코멘트 등록 실패");

    if (data.comment) {
      setComments((prev) => [...prev, data.comment!]);
    } else {
      await loadComments(orderId);
    }
  };

  if (!orderId) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <MessageSquare className="h-8 w-8 text-zinc-300" />
        <p className="mt-3 text-sm font-medium text-zinc-600">
          주문 후에 운영자와 대화할 수 있습니다
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          지금은 작업 요청 탭에서 시안에 메모를 남겨 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-100 px-4 py-4">
        <h2 className="text-sm font-bold text-zinc-900">Comment</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {orderNumber ? (
            <>
              주문 <span className="font-mono font-medium">{orderNumber}</span>
            </>
          ) : (
            "작업 관련 코멘트"
          )}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        ) : (
          <OrderCommentList
            comments={comments}
            loading={loading}
            emptyMessage="아직 코멘트가 없습니다."
          />
        )}
      </div>

      {canPost && (
        <OrderCommentForm
          onSubmit={handlePost}
          placeholder="문의나 요청사항을 남겨 주세요…"
          submitLabel="코멘트 등록"
        />
      )}
    </div>
  );
}
