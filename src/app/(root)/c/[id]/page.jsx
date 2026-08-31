import { notFound } from "next/navigation";

import { loadChatMessages } from "@/features/ai/actions/chat-store";
import { getConversation } from "@/features/conversation/actions/conversation-actions";
import { ConversationView } from "@/features/conversation/components/conversation-view";

export default async function Page({ params }) {
  const { id } = await params;

  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  const initialMessages = await loadChatMessages(id);

  return (
    <ConversationView
      key={id}
      conversationId={id}
      initialMessages={initialMessages}
    />
  );
}