import { z } from "zod";
import { CHAT_LIMITS } from "@/constants/chats.constant";

export type ChatType = "PRIVATE" | "GROUP";
export type ParticipantRole = "MEMBER" | "ADMIN";
export type MessageType = "text" | "image" | "file" | "audio";

export interface ChatParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  mediaUrl: string | null;
  readBy: string[];
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

export interface LastMessage {
  id: string;
  text: string;
  type: MessageType;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    username: string;
  };
}

export interface ChatListItem {
  id: string;
  type: ChatType;
  name: string | null;
  avatar: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: LastMessage | null;
  participants: ChatParticipant[];
  unreadCount: number;
  _count: {
    participants: number;
    messages: number;
  };
}

export interface ChatDetail extends ChatListItem {
  createdById: string | null;
}

export interface CreatePrivateChatRequest {
  targetUserId: string;
}

export interface CreateGroupChatRequest {
  name: string;
  description?: string;
  memberIds: string[];
}

export interface SendMessageRequest {
  text: string;
  type?: MessageType;
  media?: File;
}

export interface GetMessagesRequest {
  cursor?: string;
  limit?: number;
}

export interface GetChatsRequest {
  page?: number;
  limit?: number;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
}

export interface AddMembersRequest {
  memberIds: string[];
}

export interface RemoveMemberRequest {
  userId: string;
}

export interface ReadMessagesRequest {
  messageIds: string[];
}

export interface DeleteMessagesRequest {
  messageIds: string[];
}

export interface PromoteMemberRequest {
  userId: string;
}

export const createPrivateChatSchema = z.object({
  targetUserId: z.string().min(1, "User ID diperlukan"),
});

export const createGroupChatSchema = z.object({
  name: z.string().min(1, "Nama grup wajib diisi").max(CHAT_LIMITS.GROUP_NAME_MAX, `Nama grup maksimal ${CHAT_LIMITS.GROUP_NAME_MAX} karakter`),
  description: z.string().max(CHAT_LIMITS.GROUP_DESCRIPTION_MAX, `Deskripsi maksimal ${CHAT_LIMITS.GROUP_DESCRIPTION_MAX} karakter`).optional(),
  memberIds: z.array(z.string()).min(2, "Minimal 2 anggota lain diperlukan").max(99, "Maksimal 99 anggota tambahan"),
});

export const sendMessageSchema = z.object({
  text: z.string().min(1, "Pesan tidak boleh kosong").max(CHAT_LIMITS.MESSAGE_MAX_LENGTH, `Pesan maksimal ${CHAT_LIMITS.MESSAGE_MAX_LENGTH} karakter`),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1, "Nama grup wajib diisi").max(CHAT_LIMITS.GROUP_NAME_MAX).optional(),
  description: z.string().max(CHAT_LIMITS.GROUP_DESCRIPTION_MAX).optional(),
});

export type CreatePrivateChatForm = z.infer<typeof createPrivateChatSchema>;
export type CreateGroupChatForm = z.infer<typeof createGroupChatSchema>;
export type SendMessageForm = z.infer<typeof sendMessageSchema>;
export type UpdateGroupForm = z.infer<typeof updateGroupSchema>;

export interface WsNewMessagePayload {
  event: string;
  chatId: string;
  message: ChatMessage;
}

export interface WsMessageReadPayload {
  event: string;
  chatId: string;
  messageIds: string[];
  readBy: string;
}

export interface WsParticipantPayload {
  event: string;
  chatId: string;
  userId: string;
  username?: string;
}

export interface WsGroupUpdatedPayload {
  event: string;
  chatId: string;
  name?: string;
  avatar?: string;
  description?: string;
}
