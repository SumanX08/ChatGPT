"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function assertOwnsConversation(conversationId, userId) {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      userId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
}

export async function getConversation(conversationId) {
  const user = await requireUser();

  return assertOwnsConversation(conversationId, user.id);
}

export async function listConversations() {
  const user = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },

    orderBy: [
      { isPinned: "desc" },
      { lastMessageAt: "desc" },
    ],
  });

  console.log(
    "LIST CONVERSATIONS RESULT:",
    conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      isArchived: conversation.isArchived,
      parentId: conversation.parentId,
    }))
  );

  return conversations;
}

export async function createConversation(title = "New Chat") {
  const user = await requireUser();

  return prisma.conversation.create({
    data: {
      userId: user.id,
      title: title.trim() || "New Chat",
    },
  });
}

export async function updateConversation(
  conversationId,
  data
) {
  const user = await requireUser();

  await assertOwnsConversation(conversationId, user.id);

  const conversation =
    await prisma.conversation.update({
      where: {
        id: conversationId,
      },

      data: {
        ...(data.title !== undefined
          ? {
              title:
                data.title.trim() || "New Chat",
            }
          : {}),

        ...(data.isPinned !== undefined
          ? {
              isPinned: data.isPinned,
            }
          : {}),

        ...(data.isArchived !== undefined
          ? {
              isArchived: data.isArchived,
            }
          : {}),
      },
    });

  revalidatePath("/");
  revalidatePath(`/c/${conversationId}`);

  return conversation;
}

export async function deleteConversation(
  conversationId
) {
  const user = await requireUser();

  await assertOwnsConversation(
    conversationId,
    user.id
  );

  await prisma.conversation.delete({
    where: {
      id: conversationId,
    },
  });

  revalidatePath("/");

  return {
    id: conversationId,
  };
}


/* =========================================================
   BRANCHING
   ========================================================= */

/**
 * Get all branches belonging to a conversation.
 */
export async function listBranches(conversationId) {
  const user = await requireUser();

  await assertOwnsConversation(
    conversationId,
    user.id
  );

  return prisma.conversation.findMany({
    where: {
      userId: user.id,
      parentId: conversationId,
      isArchived: false,
    },

    orderBy: {
      createdAt: "asc",
    },

    select: {
      id: true,
      title: true,
      parentId: true,
      branchFromMessageId: true,
      createdAt: true,
      updatedAt: true,
      lastMessageAt: true,
    },
  });
}


/**
 * Create a new branch from a specific message.
 *
 * The branch gets a copy of all messages up to and including
 * the selected message.
 */
export async function createBranch(
  conversationId,
  messageId
) {
  const user = await requireUser();

  const parentConversation =
    await assertOwnsConversation(
      conversationId,
      user.id
    );

  // Make sure the selected message belongs
  // to the conversation being branched.
  const sourceMessage =
    await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
      },
    });

  if (!sourceMessage) {
    throw new Error(
      "Message not found in this conversation"
    );
  }

  // Get all messages up to the selected message.
  const messages =
    await prisma.message.findMany({
      where: {
        conversationId,

        createdAt: {
          lte: sourceMessage.createdAt,
        },
      },

      orderBy: {
        createdAt: "asc",
      },
    });

    const originalTitle = parentConversation.title
  .replace(/^(Branch of )+/, "");

  const branch =
    await prisma.conversation.create({
      data: {
        userId: user.id,

       title: `Branch of ${originalTitle}`,

        model: parentConversation.model,

        systemPrompt:
          parentConversation.systemPrompt,

        parentId: conversationId,

        branchFromMessageId: messageId,

        messages: {
          create: messages.map((message) => ({
            role: message.role,
            status: message.status,
            content: message.content,
            parts: message.parts,
            metadata: message.metadata,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          })),
        },
      },

      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

  revalidatePath(`/c/${conversationId}`);
  revalidatePath(`/c/${branch.id}`);
  revalidatePath("/");

  console.log("CREATED BRANCH:", {
  id: branch.id,
  userId: branch.userId,
  title: branch.title,
  isArchived: branch.isArchived,
  parentId: branch.parentId,
  branchFromMessageId: branch.branchFromMessageId,
});

  return branch;
}