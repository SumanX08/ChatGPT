"use client";

import { isTextUIPart } from "ai";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";

import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";

import {
  GitBranchIcon,
  Loader2Icon,
} from "lucide-react";

import { Loader } from "@/components/ai-elements/loader";

import { useCreateBranch } from "@/features/conversation/hooks/use-conversation";

function getMessageText(message) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

function BranchButton({ conversationId, messageId }) {
  const createBranch = useCreateBranch();

  function handleBranch() {
    createBranch.mutate({
      conversationId,
      messageId,
    });
  }

  return (
    <MessageActions className=" transition-opacity ">
      <MessageAction
        tooltip="Branch from this message"
        label="Branch from this message"
        onClick={handleBranch}
        disabled={createBranch.isPending}
      >
        {createBranch.isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : (
          <GitBranchIcon className="size-4 hover:cursor-pointer" />
        )}
      </MessageAction>
    </MessageActions>
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
  <div className="flex min-h-0 flex-1">
    <Conversation>
      <ConversationContent className="mx-auto w-full max-w-3xl py-8">
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
  </div>
);
}