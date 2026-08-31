import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  toUIMessageStream,
} from "ai";

import {
  loadChatMessages,
  saveChatMessages,
} from "@/features/ai/actions/chat-store";

import { getChatModel } from "@/features/ai/utils/model";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { webSearchTool } from "@/features/tools/web-search-tool";

export async function POST(req) {
  const requestId = Math.random()
    .toString(36)
    .slice(2, 8);

  const totalTimer = `[${requestId}] TOTAL CHAT REQUEST`;
  const parseTimer = `[${requestId}] parseRequest`;
  const userTimer = `[${requestId}] requireUser`;
  const conversationTimer = `[${requestId}] getConversation`;
  const messagesTimer = `[${requestId}] loadChatMessages`;
  const convertTimer = `[${requestId}] convertMessages`;
  const streamTimer = `[${requestId}] createStream`;
  const firstChunkTimer = `[${requestId}] TIME TO FIRST CHUNK`;

  console.log(`\n🚀 Chat request started: ${requestId}`);

  console.time(totalTimer);

  console.time(parseTimer);

  const { message, id } = await req.json();

  console.timeEnd(parseTimer);

  if (!message || !id) {
    return new Response(
      "Missing message or conversation id",
      {
        status: 400,
      }
    );
  }

  console.time(userTimer);

  const user = await requireUser();

  console.timeEnd(userTimer);

  // Run DB reads in parallel
  console.time(conversationTimer);
  console.time(messagesTimer);

  const conversationPromise =
    prisma.conversation
      .findFirst({
        where: {
          id,
          userId: user.id,
        },
      })
      .then((result) => {
        console.timeEnd(conversationTimer);
        return result;
      });

  const messagesPromise =
    loadChatMessages(id).then((result) => {
      console.timeEnd(messagesTimer);
      return result;
    });

  const [conversation, previousMessages] =
    await Promise.all([
      conversationPromise,
      messagesPromise,
    ]);

  if (!conversation) {
    console.timeEnd(totalTimer);

    return new Response(
      "Conversation not found",
      {
        status: 404,
      }
    );
  }

  const alreadySaved = previousMessages.some(
    (storedMessage) =>
      storedMessage.id === message.id
  );

  const messages = alreadySaved
    ? previousMessages
    : [...previousMessages, message];

  console.time(convertTimer);

  const modelMessages =
    await convertToModelMessages(messages);

  console.timeEnd(convertTimer);

  console.time(streamTimer);

  const result = streamText({
    model: getChatModel(conversation.model),

    system: `
You are ChaiGPT.

If a question requires current information like news, sports,
weather, stock prices or recent events, use the webSearch tool.

After receiving the search results, use them to answer the user's
question. Never stop after the tool call.
`,

    messages: modelMessages,

    tools: {
      webSearch: webSearchTool,
    },

    stopWhen: stepCountIs(3),
  });

  console.timeEnd(streamTimer);

  console.time(firstChunkTimer);

  let firstChunkReceived = false;

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,

      originalMessages: messages,

      generateMessageId: createIdGenerator({
        prefix: "msg",
        size: 16,
      }),

      onEnd: async ({
        messages: finalMessages,
      }) => {
        try {
          console.time(`[${requestId}] saveFinalMessages`);

          await saveChatMessages(
            id,
            finalMessages,
            {
              updateTitle: false,
            }
          );

          console.timeEnd(
            `[${requestId}] saveFinalMessages`
          );
        } catch (error) {
          console.error(
            "Failed to save chat messages:",
            error
          );
        }
      },
    }),
  });
}