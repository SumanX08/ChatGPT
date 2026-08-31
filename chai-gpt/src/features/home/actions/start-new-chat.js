"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";

export async function startNewChat() {
  const user = await requireUser();

  // Check if the user already has an empty conversation
  const existingEmptyConversation =
    await prisma.conversation.findFirst({
      where: {
        userId: user.id,
        isArchived: false,
        messages: {
          none: {},
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

  // Reuse the existing empty conversation
  if (existingEmptyConversation) {
    return existingEmptyConversation.id;
  }

  // Otherwise create a new conversation
  const conversation =
    await prisma.conversation.create({
      data: {
        userId: user.id,
        title: "New Chat",
      },
    });

  return conversation.id;
}