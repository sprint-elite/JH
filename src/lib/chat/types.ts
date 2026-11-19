export type ChatLink = { href: string; label: string };

export type ChatPending = {
  topic: "quote" | "order";
  productQuery?: string;
  quantity?: number;
  orderNumber?: string;
  email?: string;
} | null;

export type ChatReply = {
  text: string;
  links: ChatLink[];
  quickReplies: string[];
  pending: ChatPending;
};
