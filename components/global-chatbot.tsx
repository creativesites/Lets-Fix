"use client";

import { usePathname } from "next/navigation";

import { AdviceStudio } from "@/components/advice-studio";

export function GlobalChatbot() {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/sign-in") || pathname.startsWith("/advice")) {
    return null;
  }

  return <AdviceStudio variant="widget" />;
}
