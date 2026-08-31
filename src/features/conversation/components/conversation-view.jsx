"use client";

import React, { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { ChatComposer } from "./chat-composer";
import { ChatEmpty } from "./chat-empty";
import { ChatMessages } from "./chat-messages";

import { useConversations } from "../hooks/use-conversation";
import { queryKeys } from "../utils/query-keys";

export function ConversationView({
  conversationId,
  initialMessages,
}) {
  const queryClient = useQueryClient();
  const { data: conversations } = useConversations();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: {
            id,
            message: messages.at(-1),
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    messages: initialMessages,
    transport,

    onFinish: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  const title =
    conversations?.find(
      (item) => item.id === conversationId
    )?.title ?? "Chat";

    console.log(messages)

return (
  <div className="flex h-full min-h-0 flex-1 flex-col">
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
      <SidebarTrigger />

      <Separator
        orientation="vertical"
        className="mx-1 h-4"
      />

      <h1 className="truncate text-sm font-medium">
        {title}
      </h1>
    </header>

    {messages.length === 0 ? (
      <ChatEmpty />
    ) : (
      <ChatMessages
        messages={messages}
        status={status}
        conversationId={conversationId}
      />
    )}

    <ChatComposer
      className="shrink-0"
      onSend={(text) => {
        void sendMessage({ text });
      }}
      isSending={status !== "ready"}
      autoFocus
    />
  </div>
);
}