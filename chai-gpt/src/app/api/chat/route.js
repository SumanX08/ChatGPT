import { auth } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";
import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { webSearchTool } from "@/features/tools/web-search-tool";

export async function POST(req) {
  await auth.protect();

  const { message, id } = await req.json();

  if (!message || !id) {
    return new Response("Missing message or conversation id", {
      status: 400,
    });
  }

  const user = await requireUser();

  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!conversation) {
    return new Response("Conversation not found", {
      status: 404,
    });
  }

  const previousMessages = await loadChatMessages(id);

  const alreadySaved = previousMessages.some(
    (storedMessage) => storedMessage.id === message.id
  );

  const messages = alreadySaved
    ? previousMessages
    : [...previousMessages, message];

  if (!alreadySaved) {
    await saveChatMessages(id, [message]);
  }

 const result = streamText({
  model: getChatModel(conversation.model),

  system: `
You are ChaiGPT.

If a question requires current information like news, sports,
weather, stock prices or recent events, use the webSearch tool.

After receiving the search results, use them to answer the user's
question. Never stop after the tool call.
`,

  messages: await convertToModelMessages(messages),

  tools: {
    webSearch: webSearchTool,
  },

  stopWhen: stepCountIs(3),
});




  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),
      onEnd: async ({ messages: finalMessages }) => {
        try {
          await saveChatMessages(id, finalMessages, {
            updateTitle: false,
          });
        } catch (error) {
          console.error(error);
        }
      },
    }),
  });
}