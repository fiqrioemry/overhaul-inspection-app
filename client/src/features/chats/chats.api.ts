import qs from "qs";
import api from "@/lib/axios";
import type {
  ChatDetail,
  ChatListItem,
  ChatMessage,
  ChatParticipant,
  AddMembersRequest,
  CreateGroupChatRequest,
  CreatePrivateChatRequest,
  DeleteMessagesRequest,
  GetChatsRequest,
  GetMessagesRequest,
  PromoteMemberRequest,
  ReadMessagesRequest,
  RemoveMemberRequest,
  ReactionRequest,
  ReactionToggleResult,
  ReactionGroup,
  SendMessageRequest,
  UpdateGroupRequest,
} from "@/schemas/chats.schema";
import { CHAT_ENDPOINTS } from "@/constants/chats.constant";
import type { ResponseSuccess } from "@/types/response.type";

export async function fetchMyChats(query: GetChatsRequest = {}): Promise<ResponseSuccess<ChatListItem[]>> {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${CHAT_ENDPOINTS.getMyChats}?${queryString}`);
  return res.data;
}

export async function createPrivateChat(payload: CreatePrivateChatRequest): Promise<ResponseSuccess<ChatDetail>> {
  const res = await api.post(CHAT_ENDPOINTS.createPrivateChat, payload);
  return res.data;
}

export async function createGroupChat(payload: CreateGroupChatRequest): Promise<ResponseSuccess<ChatDetail>> {
  const res = await api.post(CHAT_ENDPOINTS.createGroupChat, payload);
  return res.data;
}

export async function fetchChatById(chatId: string): Promise<ResponseSuccess<ChatDetail>> {
  const res = await api.get(CHAT_ENDPOINTS.getChatById.replace(":chatId", chatId));
  return res.data;
}

export async function fetchMessages(chatId: string, query: GetMessagesRequest = {}): Promise<ResponseSuccess<ChatMessage[]>> {
  const queryString = qs.stringify(query, { skipNulls: true });
  const res = await api.get(`${CHAT_ENDPOINTS.getMessages.replace(":chatId", chatId)}?${queryString}`);
  return res.data;
}

export async function sendMessage(chatId: string, payload: SendMessageRequest): Promise<ResponseSuccess<ChatMessage>> {
  const formData = new FormData();
  formData.append("text", payload.text);
  formData.append("type", payload.type ?? "text");

  if (payload.media) {
    formData.append("media", payload.media);
  }
  if (payload.replyToId) {
    formData.append("replyToId", payload.replyToId);
  }

  const res = await api.post(CHAT_ENDPOINTS.sendMessage.replace(":chatId", chatId), formData, { headers: { "Content-Type": "multipart/form-data" } });
  return res.data;
}

export async function deleteMessages(chatId: string, payload: DeleteMessagesRequest): Promise<ResponseSuccess<void>> {
  const res = await api.delete(CHAT_ENDPOINTS.deleteMessages.replace(":chatId", chatId), { data: payload });
  return res.data;
}

export async function readMessages(chatId: string, payload: ReadMessagesRequest): Promise<ResponseSuccess<{ updatedCount: number }>> {
  const res = await api.patch(CHAT_ENDPOINTS.readMessages.replace(":chatId", chatId), payload);
  return res.data;
}

export async function updateGroup(chatId: string, payload: UpdateGroupRequest): Promise<ResponseSuccess<ChatDetail>> {
  const res = await api.patch(CHAT_ENDPOINTS.updateGroup.replace(":chatId", chatId), payload);
  return res.data;
}

export async function addMembers(chatId: string, payload: AddMembersRequest): Promise<ResponseSuccess<ChatParticipant[]>> {
  const res = await api.post(CHAT_ENDPOINTS.addMembers.replace(":chatId", chatId), payload);
  return res.data;
}

export async function removeMember(chatId: string, payload: RemoveMemberRequest): Promise<ResponseSuccess<void>> {
  const res = await api.delete(CHAT_ENDPOINTS.removeMember.replace(":chatId", chatId), { data: payload });
  return res.data;
}

export async function leaveGroup(chatId: string): Promise<ResponseSuccess<void>> {
  const res = await api.delete(CHAT_ENDPOINTS.leaveGroup.replace(":chatId", chatId));
  return res.data;
}

export async function promoteMember(chatId: string, payload: PromoteMemberRequest): Promise<ResponseSuccess<void>> {
  const res = await api.patch(CHAT_ENDPOINTS.promoteMember.replace(":chatId", chatId), payload);
  return res.data;
}

export async function demoteMember(chatId: string, payload: PromoteMemberRequest): Promise<ResponseSuccess<void>> {
  const res = await api.patch(CHAT_ENDPOINTS.demoteMember.replace(":chatId", chatId), payload);
  return res.data;
}

export async function getUnreadMessagesCount() {
  const res = await api.get(CHAT_ENDPOINTS.getUnreadMessagesCount);
  return res.data;
}

export async function addReaction(chatId: string, messageId: string, payload: ReactionRequest): Promise<ResponseSuccess<ReactionToggleResult>> {
  const url = CHAT_ENDPOINTS.addReaction.replace(":chatId", chatId).replace(":messageId", messageId);
  const res = await api.post(url, payload);
  return res.data;
}

export async function removeReaction(chatId: string, messageId: string, payload: ReactionRequest): Promise<ResponseSuccess<ReactionGroup[]>> {
  const url = CHAT_ENDPOINTS.removeReaction.replace(":chatId", chatId).replace(":messageId", messageId);
  const res = await api.delete(url, { data: payload });
  return res.data;
}
