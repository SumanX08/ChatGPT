import { auth } from "@clerk/nextjs/server";

import { onBoard } from "@/features/auth/action/onboard";
import { ChatShell } from "@/features/conversation/components/chat-shell";

export default async function RootGroupLayout({
  children,
}) {
  await auth.protect();
  await onBoard();

  return <ChatShell>{children}</ChatShell>;
}