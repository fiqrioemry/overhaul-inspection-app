import { toast } from "sonner";
import type {
  ChatMessage,
  GetChatsRequest,
  AddMembersRequest,
  GetMessagesRequest,
  UpdateGroupRequest,
  SendMessageRequest,
  RemoveMemberRequest,
  ReadMessagesRequest,
  PromoteMemberRequest,
  DeleteMessagesRequest,
  CreateGroupChatRequest,
  CreatePrivateChatRequest,
  ReactionRequest,
} from "@/schemas/chats.schema";
import type { ResponseSuccess } from "@/types/response.type";
import { useQuery, useMutation, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useChatStore } from "@/stores/chat.store";
import {
  fetchMyChats,
  fetchChatById,
  fetchMessages,
  sendMessage,
  deleteMessages,
  readMessages,
  createPrivateChat,
  createGroupChat,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
  promoteMember,
  demoteMember,
  getUnreadMessagesCount,
  addReaction,
  removeReaction,
} from "./chats.api";

export const CHAT_KEYS = {
  all: ["chats"] as const,
  lists: (params?: GetChatsRequest) => ["chats", "list", params] as const,
  detail: (chatId: string) => ["chats", "detail", chatId] as const,
  messages: (chatId: string, params?: GetMessagesRequest) => ["chats", "messages", chatId, params] as const,
};

export function useMyChats(params: GetChatsRequest = {}) {
  return useQuery({
    queryKey: CHAT_KEYS.lists(params),
    queryFn: () => fetchMyChats(params),
    staleTime: 1000 * 30,
  });
}

export function useChatById(chatId: string) {
  return useQuery({
    queryKey: CHAT_KEYS.detail(chatId),
    queryFn: () => fetchChatById(chatId),
    enabled: !!chatId,
    staleTime: 1000 * 60,
  });
}

export function useInfiniteMessages(chatId: string, params: Omit<GetMessagesRequest, "cursor"> = {}) {
  return useInfiniteQuery<ResponseSuccess<ChatMessage[]>, Error, InfiniteData<ResponseSuccess<ChatMessage[]>>, ReturnType<typeof CHAT_KEYS.messages>, string | undefined>({
    queryKey: CHAT_KEYS.messages(chatId, params),
    queryFn: ({ pageParam }) => fetchMessages(chatId, { ...params, cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.meta?.pagination?.nextCursor ?? undefined,
    initialPageParam: undefined,
    enabled: !!chatId,
    staleTime: 1000 * 30,
  });
}

export function useCreatePrivateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrivateChatRequest) => createPrivateChat(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useCreateGroupChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupChatRequest) => createGroupChat(payload),
    onSuccess: (res) => {
      toast.success(res.message || "Grup berhasil dibuat!");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => sendMessage(chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message || "Gagal mengirim pesan.");
    },
  });
}

export function useDeleteMessages(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeleteMessagesRequest) => deleteMessages(chatId, payload),
    onSuccess: () => {
      toast.success("Pesan berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useReadMessages(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReadMessagesRequest) => readMessages(chatId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
  });
}

// for group management
export function useUpdateGroup(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGroupRequest) => updateGroup(chatId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Grup berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.detail(chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useAddMembers(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMembersRequest) => addMembers(chatId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Anggota berhasil ditambahkan!");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.detail(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveMember(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RemoveMemberRequest) => removeMember(chatId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Anggota berhasil dihapus.");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.detail(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useLeaveGroup(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveGroup(chatId),
    onSuccess: (res) => {
      toast.success(res.message || "Kamu telah keluar dari grup.");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.all });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function usePromoteMember(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromoteMemberRequest) => promoteMember(chatId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Anggota dipromosikan menjadi admin.");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.detail(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useDemoteMember(chatId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PromoteMemberRequest) => demoteMember(chatId, payload),
    onSuccess: (res) => {
      toast.success(res.message || "Admin diturunkan menjadi anggota.");
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.detail(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useUnreadMessagesCount() {
  return useQuery({
    queryKey: ["chats", "unreadCount"] as const,
    queryFn: () => getUnreadMessagesCount(),
    select: (data) => data.data.unreadCount,
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useAddReaction(chatId: string, messageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReactionRequest) => addReaction(chatId, messageId, payload),
    onSuccess: (res) => {
      // Instantly reflect the updated reactions without waiting for cache invalidation
      useChatStore.getState().updateOptimisticReactions(chatId, messageId, res.data.reactions);
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveReaction(chatId: string, messageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReactionRequest) => removeReaction(chatId, messageId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
