"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  MessageCircle,
  MessageSquare,
  Minus,
  Pencil,
  Send,
  Settings,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { ChatLink, ChatPending } from "@/lib/chat/types";
import {
  createThread,
  formatThreadTime,
  loadSoundOn,
  loadThreads,
  loadUnreadCount,
  previewText,
  saveSoundOn,
  saveUnreadCount,
  threadTitleFromMessages,
  upsertThread,
  newThreadId,
  type ChatThread,
  type StoredChatMessage,
} from "@/lib/chat/history";

function playChatChime() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.07;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.stop(ctx.currentTime + 0.16);
    window.setTimeout(() => void ctx.close(), 250);
  } catch {
    /* ignore */
  }
}

type Tab = "home" | "inbox" | "settings";

function MessageLink({ href, label }: ChatLink) {
  const className =
    "mt-2 mr-1.5 inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-600 hover:bg-rose-100";
  if (href.startsWith("tel:") || href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function ChatWidget() {
  const { user } = useAuth();
  const info = useSiteSettings();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tab, setTab] = useState<Tab>("home");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [active, setActive] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);
  const soundOnRef = useRef(true);

  useEffect(() => {
    setThreads(loadThreads());
    setSoundOn(loadSoundOn());
    setUnreadCount(loadUnreadCount());
    setHydrated(true);
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  function clearUnread() {
    setUnreadCount(0);
    saveUnreadCount(0);
  }

  function bumpUnread() {
    if (openRef.current) return;
    setUnreadCount((prev) => {
      const next = Math.min(99, prev + 1);
      saveUnreadCount(next);
      return next;
    });
    if (soundOnRef.current) playChatChime();
  }

  function openWidget() {
    clearUnread();
    setOpen(true);
  }

  useEffect(() => {
    if (!open || !active) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    const t = window.setTimeout(() => inputRef.current?.focus(), 180);
    return () => window.clearTimeout(t);
  }, [open, active?.id, active?.messages.length, sending]);

  function persist(next: ChatThread) {
    const titled = {
      ...next,
      title: threadTitleFromMessages(next.messages),
      updatedAt: Date.now(),
    };
    setActive(titled);
    setThreads((prev) => upsertThread(prev, titled));
  }

  function startNewChat() {
    const thread = createThread();
    setThreads((prev) => upsertThread(prev, thread));
    setActive(thread);
    setDraft("");
  }

  function openThread(thread: ChatThread) {
    setActive(thread);
    setDraft("");
  }

  function closeThread() {
    setActive(null);
    setTab("inbox");
  }

  async function pushUserAndReply(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const current = active ?? createThread();
    const userMsg: StoredChatMessage = {
      id: newThreadId(),
      role: "user",
      text: trimmed,
    };
    const withUser: ChatThread = {
      ...current,
      messages: [...current.messages, userMsg],
    };
    persist(withUser);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, pending: withUser.pending }),
      });
      const data = (await res.json()) as {
        text?: string;
        links?: ChatLink[];
        quickReplies?: string[];
        pending?: ChatPending;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "답변을 가져오지 못했습니다.");
      persist({
        ...withUser,
        pending: data.pending ?? null,
        quickReplies: data.quickReplies?.length
          ? data.quickReplies
          : withUser.quickReplies,
        messages: [
          ...withUser.messages,
          {
            id: newThreadId(),
            role: "bot",
            text: data.text ?? "잠시 후 다시 시도해 주세요.",
            links: data.links,
          },
        ],
      });
      bumpUnread();
    } catch {
      persist({
        ...withUser,
        pending: null,
        messages: [
          ...withUser.messages,
          {
            id: newThreadId(),
            role: "bot",
            text: "잠시 연결이 원활하지 않아요. 1:1 문의나 전화로 남겨 주세요.",
            links: [{ href: "/inquiry", label: "1:1 문의하기" }],
          },
        ],
      });
      bumpUnread();
    } finally {
      setSending(false);
    }
  }

  const inThread = Boolean(active);

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {open ? (
        <div className="flex h-[min(34rem,calc(100dvh-6rem))] w-[min(22.5rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(24,24,27,0.22)]">
          {inThread ? (
            <ThreadHeader
              onBack={closeThread}
              onClose={() => setOpen(false)}
            />
          ) : (
            <PanelHeader
              tab={tab}
              onMinimize={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          )}

          {inThread && active ? (
            <>
              <div
                ref={listRef}
                className="flex-1 space-y-3 overflow-y-auto bg-zinc-50 px-3 py-3"
              >
                {active.messages.map((msg) =>
                  msg.role === "bot" ? (
                    <div key={msg.id} className="flex gap-2">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        DJ
                      </span>
                      <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-800 shadow-sm ring-1 ring-zinc-100">
                        <p className="whitespace-pre-line">{msg.text}</p>
                        {msg.links?.length ? (
                          <div className="flex flex-wrap">
                            {msg.links.map((link) => (
                              <MessageLink
                                key={`${link.href}-${link.label}`}
                                {...link}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-rose-500 px-3 py-2 text-[13px] leading-relaxed text-white">
                        {msg.text}
                      </div>
                    </div>
                  ),
                )}
                {sending ? (
                  <div className="flex gap-2">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      DJ
                    </span>
                    <div className="rounded-2xl rounded-tl-md bg-white px-3 py-2.5 shadow-sm ring-1 ring-zinc-100">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {active.quickReplies.map((label) => (
                    <button
                      key={label}
                      type="button"
                      disabled={sending}
                      onClick={() => void pushUserAndReply(label)}
                      className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <form
                className="flex items-center gap-2 border-t border-zinc-200 bg-white px-3 py-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  void pushUserAndReply(draft);
                }}
              >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="메시지를 입력하세요"
                  className="h-10 min-w-0 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 text-sm outline-none placeholder:text-zinc-400 focus:border-rose-300 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white hover:bg-rose-600 disabled:bg-zinc-200 disabled:text-zinc-400"
                  aria-label="메시지 보내기"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50">
                {tab === "home" ? (
                  <HomeTab
                    hours={info.hours}
                    phone={info.phone}
                    onStart={startNewChat}
                  />
                ) : null}
                {tab === "inbox" ? (
                  <InboxTab
                    ready={hydrated}
                    threads={threads}
                    onOpen={openThread}
                    onStart={startNewChat}
                  />
                ) : null}
                {tab === "settings" ? (
                  <SettingsTab
                    userName={user?.name ?? null}
                    soundOn={soundOn}
                    hours={info.hours}
                    phone={info.phone}
                    onSoundChange={(on) => {
                      setSoundOn(on);
                      saveSoundOn(on);
                    }}
                  />
                ) : null}
              </div>
              <nav className="grid grid-cols-3 border-t border-zinc-200 bg-white">
                <TabBtn
                  active={tab === "home"}
                  icon={<Home className="h-4 w-4" />}
                  label="홈"
                  onClick={() => setTab("home")}
                />
                <TabBtn
                  active={tab === "inbox"}
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="대화"
                  onClick={() => setTab("inbox")}
                />
                <TabBtn
                  active={tab === "settings"}
                  icon={<Settings className="h-4 w-4" />}
                  label="설정"
                  onClick={() => setTab("settings")}
                />
              </nav>
            </>
          )}
        </div>
      ) : (
        <div className="relative">
          {unreadCount >= 3 ? (
            <button
              type="button"
              onClick={openWidget}
              className="absolute right-16 bottom-1 w-max max-w-[13.5rem] rounded-2xl rounded-br-md bg-zinc-900 px-3 py-2 text-left text-[12px] font-semibold leading-snug text-white shadow-[0_10px_24px_rgba(24,24,27,0.28)]"
            >
              새 메시지 {unreadCount}개 도착했어요
            </button>
          ) : null}
          <button
            type="button"
            onClick={openWidget}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-white shadow-[0_10px_28px_rgba(244,63,94,0.45)] transition hover:bg-rose-600"
            aria-label="상담 챗봇 열기"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>
      )}
    </div>
  );
}

function PanelHeader({
  tab,
  onMinimize,
  onClose,
}: {
  tab: Tab;
  onMinimize: () => void;
  onClose: () => void;
}) {
  const title =
    tab === "home" ? "대지나염 상담" : tab === "inbox" ? "대화" : "설정";
  return (
    <div className="flex items-center gap-3 bg-zinc-900 px-4 py-3 text-white">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500">
        <MessageCircle className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{title}</p>
        {tab === "home" ? (
          <p className="flex items-center gap-1.5 text-[11px] text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            상품·주문 안내
          </p>
        ) : tab === "inbox" ? (
          <p className="text-[11px] text-zinc-400">이전 상담을 이어서 볼 수 있어요</p>
        ) : (
          <p className="text-[11px] text-zinc-400">상담 환경</p>
        )}
      </div>
      <button
        type="button"
        onClick={onMinimize}
        className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
        aria-label="상담창 최소화"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
        aria-label="상담창 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ThreadHeader({
  onBack,
  onClose,
}: {
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-3 text-white">
      <button
        type="button"
        onClick={onBack}
        className="rounded-full px-2 py-1 text-[12px] font-semibold text-zinc-200 hover:bg-white/10"
      >
        목록
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">대지나염 상담</p>
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          상품·주문 안내
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
        aria-label="상담창 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TabBtn({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
        active ? "text-rose-600" : "text-zinc-400 hover:text-zinc-600"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function HomeTab({
  hours,
  phone,
  onStart,
}: {
  hours: string;
  phone: string;
  onStart: () => void;
}) {
  return (
    <div className="p-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-100">
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
            DJ
          </span>
          <p className="text-[13px] leading-relaxed text-zinc-800">
            안녕하세요. 어떤 문의 하시나요? 상품·견적·주문 안내를 도와드릴게요.
          </p>
        </div>
        <div className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-[12px] leading-relaxed text-zinc-600">
          <p className="font-semibold text-zinc-800">[안내]</p>
          <p className="mt-1">상담 시간 : {hours}</p>
          <p>전화 : {phone}</p>
        </div>
        <button
          type="button"
          onClick={onStart}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
        >
          문의하기
          <Send className="h-4 w-4" />
        </button>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          상품·주문은 바로 안내받을 수 있어요
        </p>
      </div>
    </div>
  );
}

function InboxTab({
  ready,
  threads,
  onOpen,
  onStart,
}: {
  ready: boolean;
  threads: ChatThread[];
  onOpen: (thread: ChatThread) => void;
  onStart: () => void;
}) {
  if (!ready) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-400">불러오는 중…</p>;
  }

  if (threads.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <MessageSquare className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-zinc-500">대화를 시작해보세요</p>
        <button
          type="button"
          onClick={onStart}
          className="mt-5 flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
        >
          새 문의하기
          <Send className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <ul className="divide-y divide-zinc-100 bg-white">
        {threads.map((thread) => (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => onOpen(thread)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-zinc-50"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                DJ
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-semibold text-zinc-900">
                    {thread.title}
                  </span>
                  <span className="shrink-0 text-[11px] text-zinc-400">
                    {formatThreadTime(thread.updatedAt)}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-zinc-500">
                  {previewText(thread)}
                </span>
              </span>
              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-zinc-300" />
            </button>
          </li>
        ))}
      </ul>
      <div className="p-3">
        <button
          type="button"
          onClick={onStart}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          새 문의하기
        </button>
      </div>
    </div>
  );
}

function SettingsTab({
  userName,
  soundOn,
  hours,
  phone,
  onSoundChange,
}: {
  userName: string | null;
  soundOn: boolean;
  hours: string;
  phone: string;
  onSoundChange: (on: boolean) => void;
}) {
  return (
    <div className="bg-white">
      <div className="flex flex-col items-center px-4 py-6">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-sm font-bold text-white">
          DJ
        </span>
        <p className="mt-2 text-sm font-semibold text-zinc-900">
          {userName ?? "연락처 정보"}
        </p>
        <Link
          href={userName ? "/mypage/profile" : "/login?next=/mypage/profile"}
          className="mt-2 inline-flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-[12px] font-medium text-zinc-600 hover:bg-zinc-50"
        >
          <Pencil className="h-3 w-3" />
          정보 수정하기
        </Link>
      </div>
      <div className="border-t border-zinc-100 px-4 py-3">
        <p className="text-[11px] font-semibold text-zinc-400">상담 환경</p>
        <div className="mt-2 divide-y divide-zinc-100">
          <div className="flex items-center justify-between py-3 text-[13px]">
            <span className="text-zinc-800">언어</span>
            <span className="text-zinc-500">한국어</span>
          </div>
          <label className="flex items-center justify-between py-3 text-[13px]">
            <span className="text-zinc-800">알림음</span>
            <input
              type="checkbox"
              checked={soundOn}
              onChange={(e) => onSoundChange(e.target.checked)}
              className="h-4 w-4 accent-rose-500"
            />
          </label>
          <div className="py-3 text-[13px] text-zinc-600">
            <p>고객센터 {phone}</p>
            <p className="mt-1">{hours}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
