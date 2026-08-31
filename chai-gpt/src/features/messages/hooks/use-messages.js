"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "@/features/conversation/utils/query-keys";

import {
  createMessage,
  deleteMessage,
  listMessages,
  updateMessage,
} from "../actions/messages-action";

export function useMessages(conversationId) {
  return useQuery({
    queryKey: queryKeys.messages.byConversation(
      conversationId ?? "none"
    ),
    queryFn: () => listMessages(conversationId),
    enabled: Boolean(conversationId),
  });
}

export function useCreateMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content) =>
      createMessage(conversationId, content),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.messages.byConversation(
            conversationId
          ),
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
    },

    onError: (error) => {
      toast.error(error.message || "Could not send message");
    },
  });
}

export function useUpdateMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }) =>
      updateMessage(id, content),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.messages.byConversation(
            conversationId
          ),
      });
    },

    onError: (error) => {
      toast.error(
        error.message || "Could not update message"
      );
    },
  });
}

export function useDeleteMessage(conversationId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteMessage(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey:
          queryKeys.messages.byConversation(
            conversationId
          ),
      });

      toast.success("Message deleted");
    },

    onError: (error) => {
      toast.error(
        error.message || "Could not delete message"
      );
    },
  });
}