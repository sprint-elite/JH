"use client";

import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBuilder = pathname.startsWith("/builder");
  const isProductStudio = pathname.startsWith("/products");
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";
  const isMyPage = pathname.startsWith("/mypage");
  const isCheckout = pathname.startsWith("/checkout");
  const isCart = pathname.startsWith("/cart");
  const isStorefront =
    pathname.startsWith("/templates") ||
    pathname.startsWith("/guides") ||
    pathname.startsWith("/ideas") ||
    pathname.startsWith("/inquiry") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/orders");
  const isLegal =
    pathname.startsWith("/terms") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/returns");

  const showChat = !isAdmin && !isBuilder;

  if (
    isBuilder ||
    isProductStudio ||
    isAdmin ||
    isHome ||
    isMyPage ||
    isLegal ||
    isCheckout ||
    isCart ||
    isStorefront
  ) {
    return (
      <>
        {children}
        {showChat ? <ChatWidget /> : null}
      </>
    );
  }

  return (
    <>
      <AppHeader />
      {children}
      {showChat ? <ChatWidget /> : null}
    </>
  );
}