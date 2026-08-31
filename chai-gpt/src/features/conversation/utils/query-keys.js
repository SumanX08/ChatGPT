export const queryKeys = {
  conversations: {
    all: ["conversations"],
    detail: (id) => ["conversations", id],
  },
  messages: {
    byConversation: (conversationId) => [
      "messages",
      conversationId,
    ],
  },
};