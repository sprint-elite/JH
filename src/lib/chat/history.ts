import type { ChatLink, ChatPending } from "@/lib/chat/types";

export const CHAT_HISTORY_KEY = "daeji-chat-threads";
export const CHAT_SOUND_KEY = "daeji-chat-sound";
export const CHAT_UNREAD_KEY = "daeji-chat-unread";

export type ChatRole = "bot" | "user";

export type StoredChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  links?: ChatLink[];
};

export type ChatThread = {
  id: string;
  title: string;
  updatedAt: number;
  messages: StoredChatMessage[];
  pending: ChatPending;
  quickReplies: string[];
};

const WELCOME: StoredChatMessage = {
  id: "welcome",
  role: "bot",
  text: "안녕하세요! 대지나염입니다.\n최소 수량, 대략 견적, 주문 조회를 안내해 드려요. 제가 모르는 내용은 전화나 1:1 문의로 연결해 드릴게요.",
};

export const DEFAULT_QUICK = [
  "최소 몇 장부터요?",
  "단체 견적 받고 싶어요",
  "내 주문 조회",
  "1:1 문의하기",
];

export function newThreadId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createThread(): ChatThread {
  return {
    id: newThreadId(),
    title: "새 상담",
    updatedAt: Date.now(),
    messages: [{ ...WELCOME, id: newThreadId() }],
    pending: null,
    quickReplies: [...DEFAULT_QUICK],
  };
}

export function threadTitleFromMessages(messages: StoredChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  const raw = firstUser?.text.replace(/\s+/g, " ").trim() ?? "새 상담";
  return raw.length > 24 ? `${raw.slice(0, 24)}…` : raw || "새 상담";
}

function isThread(value: unknown): value is ChatThread {
  if (!value || typeof value !== "object") return false;
  const t = value as ChatThread;
  return (
    typeof t.id === "string" &&
    typeof t.title === "string" &&
    typeof t.updatedAt === "number" &&
    Array.isArray(t.messages)
  );
}

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isThread).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]) {
  if (typeof window === "undefined") return;
  const next = threads
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 30);
  window.localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(next));
}

export function upsertThread(threads: ChatThread[], thread: ChatThread): ChatThread[] {
  const others = threads.filter((t) => t.id !== thread.id);
  return saveAndReturn([thread, ...others]);
}

function saveAndReturn(threads: ChatThread[]) {
  saveThreads(threads);
  return loadThreads();
}

export function previewText(thread: ChatThread): string {
  const last = [...thread.messages].reverse().find((m) => m.text.trim());
  return last?.text.replace(/\s+/g, " ").trim() || "대화가 없습니다.";
}

export function formatThreadTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

export function loadSoundOn(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(CHAT_SOUND_KEY) !== "0";
}

export function saveSoundOn(on: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAT_SOUND_KEY, on ? "1" : "0");
}

export function loadUnreadCount(): number {
  if (typeof window === "undefined") return 0;
  const n = Number(window.localStorage.getItem(CHAT_UNREAD_KEY) ?? "0");
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(99, Math.floor(n));
}

export function saveUnreadCount(count: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CHAT_UNREAD_KEY,
    String(Math.max(0, Math.min(99, Math.floor(count)))),
  );
}
