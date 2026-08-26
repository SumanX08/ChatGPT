"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createConversation,
  deleteConversation,
  listConversations,
  updateConversation,
} from "@/features/conversation/actions/conversation-actions";

import { queryKeys } from "../utils/query-keys";


export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations.all,
    queryFn: () => listConversations(),
  });
}


export function useCreateConversation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (title) => createConversation(title),

    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });

      router.push(`/c/${conversation.id}`);
    },

    onError: (error) => {
      toast.error(error.message || "Could not create chat");
    },
  });
}


export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }) =>
      updateConversation(id, data),

    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });

      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.detail(
          conversation.id
        ),
      });
    },

    onError: (error) => {
      toast.error(error.message || "Could not update chat");
    },
  });
}


export function useDeleteConversation(activeId) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (id) => deleteConversation(id),

    onSuccess: ({ id }) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });

      queryClient.removeQueries({
        queryKey: queryKeys.messages.byConversation(id),
      });

      if (activeId === id) {
        router.push("/");
      }

      toast.success("Chat deleted");
    },

    onError: (error) => {
      toast.error(error.message || "Could not delete chat");
    },
  });
}