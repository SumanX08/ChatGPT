"use client";

import { isTextUIPart } from "ai";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";

import { Loader } from "@/components/ai-elements/loader";

import { createBranch } from "@/features/conversation/actions/conversation-actions";

function getMessageText(message) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function BranchButton({ conversationId, messageId }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleBranch() {
    startTransition(async () => {
      try {
        const branch = await createBranch(
          conversationId,
          messageId
        );

        router.push(`/c/${branch.id}`);
      } catch (error) {
        console.error("Failed to create branch:", error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleBranch}
      disabled={isPending}
      className="mt-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {isPending ? "Creating branch..." : "Branch"}
    </button>
  );
}

export function ChatMessages({
  messages,
  status,
  conversationId,
}) {
  const isWaiting =
    status === "submitted" &&
    messages.at(-1)?.role === "user";

  const isSearching = messages.at(-1)?.parts?.some(
    (part) =>
      part.type === "tool-webSearch" &&
      part.state !== "output-available"
  );

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => {
          const text = getMessageText(message);

          return (
            <Message
              key={message.id}
              from={message.role}
            >
              <MessageContent>
                {text && (
                  <MessageResponse>
                    {text}
                  </MessageResponse>
                )}

                {(message.role === "user" ||
                  message.role === "assistant") &&
                  text && (
                    <BranchButton
                      conversationId={conversationId}
                      messageId={message.id}
                    />
                  )}
              </MessageContent>
            </Message>
          );
        })}

        {isWaiting && (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        )}

        {isSearching && (
          <Message from="assistant">
            <MessageContent>
              <Loader />

              <span className="text-sm text-muted-foreground">
                Searching the web...
              </span>
            </MessageContent>
          </Message>
        )}
      </ConversationContent>
    </Conversation>
  );
}