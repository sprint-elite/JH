"use client";

import { useState } from "react";
import { MessageSquare, MapPin } from "lucide-react";
import { AnnotationPanelContent } from "./AnnotationSidebar";
import { OrderCommentsPanel } from "./OrderCommentsPanel";

type SidebarTab = "annotations" | "comments";

interface LeftSidebarProps {
  orderId: string | null;
  orderNumber?: string;
}

const TABS: {
  key: SidebarTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "annotations", label: "작업 요청", icon: MapPin },
  { key: "comments", label: "Comment", icon: MessageSquare },
];

export function LeftSidebar({ orderId, orderNumber }: LeftSidebarProps) {
  const [tab, setTab] = useState<SidebarTab>("annotations");

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r border-zinc-200 bg-white">
      <div className="flex shrink-0 border-b border-zinc-100">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-xs font-semibold transition-colors ${
                active
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "annotations" ? (
          <AnnotationPanelContent />
        ) : (
          <OrderCommentsPanel orderId={orderId} orderNumber={orderNumber} />
        )}
      </div>
    </aside>
  );
}
