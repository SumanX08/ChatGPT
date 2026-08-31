"use server";

import { isTextUIPart } from "ai";
import { prisma } from "@/lib/db";

/**
 * Extract plain text from a UIMessage.
 * Tool messages may not contain text, so return an empty string.
 */
function getMessageText(message) {
  if (!message.parts) return "";

  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("");
}

/**
 * Restore message parts from the database.
 */
function toUIMessageParts(parts, content) {
  if (Array.isArray(parts) && parts.length > 0) {
    return parts;
  }

  return [
    {
      type: "text",
      text: content ?? "",
    },
  ];
}

const roleMap = {
  user: "USER",
  assistant: "ASSISTANT",
  tool: "TOOL",
  system: "SYSTEM",
};

const reverseRoleMap = {
  USER: "user",
  ASSISTANT: "assistant",
  TOOL: "tool",
  SYSTEM: "system",
};

/**
 * Load conversation messages.
 */
export async function loadChatMessages(conversationId) {
  const rows = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return rows.map((row) => ({
    id: row.id,
    role: reverseRoleMap[row.role],
    parts: toUIMessageParts(row.parts, row.content),
  }));
}

/**
 * Save streamed UI messages.
 */
export async function saveChatMessages(
  conversationId,
  messages,
  options = {}
) {
  const { updateTitle = true } = options;

  for (const message of messages) {
    // Skip system prompts only
    if (message.role === "system") continue;

    await prisma.message.upsert({
      where: {
        id: message.id,
      },
      create: {
        id: message.id,
        conversationId,
        role: roleMap[message.role],
        status: "COMPLETE",
        content: getMessageText(message),
        parts: message.parts,
      },
      update: {
        role: roleMap[message.role],
        status: "COMPLETE",
        content: getMessageText(message),
        parts: message.parts,
      },
    });
  }

  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: {
      id: conversationId,
    },
    select: {
      title: true,
    },
  });

  const firstUser = messages.find((m) => m.role === "user");

  const firstUserText = firstUser
    ? getMessageText(firstUser).trim()
    : "";

  await prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      lastMessageAt: new Date(),
      title:
        updateTitle &&
        conversation.title === "New Chat" &&
        firstUserText
          ? firstUserText.slice(0, 48)
          : conversation.title,
    },
  });
}