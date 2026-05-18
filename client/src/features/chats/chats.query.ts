import { toast } from "sonner";
import { useQuery, useMutation, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { fetchMyChats, fetchChatById, fetchMessages, sendMessage, deleteMessages, readMessages, createPrivateChat, createGroupChat, updateGroup, addMembers, removeMember, leaveGroup, promoteMember, demoteMember } from "./chats.api";
import type {
  AddMembersRequest,
  ChatMessage,
  CreateGroupChatRequest,
  CreatePrivateChatRequest,
  DeleteMessagesRequest,
  GetChatsRequest,
  GetMessagesRequest,
  PromoteMemberRequest,
  ReadMessagesRequest,
  RemoveMemberRequest,
  SendMessageRequest,
  UpdateGroupRequest,
} from "@/schemas/chats.schema";
import type { ResponseSuccess } from "@/types/response.type";

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

// ─── Group management ─────────────────────────────────────────────────────────

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
