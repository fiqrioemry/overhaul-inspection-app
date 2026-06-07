export type ChatType = "PRIVATE" | "GROUP";
export type ParticipantRole = "MEMBER" | "ADMIN";
export type MessageType = "text" | "image" | "file" | "audio";

export interface ChatParticipantUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  user: ChatParticipantUser;
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

export interface ReplyToMessage {
  id: string;
  text: string;
  type: MessageType;
  sender: { id: string; name: string; username: string };
}

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
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
  sender: ChatParticipantUser;
  replyTo: ReplyToMessage | null;
  reactions: ReactionGroup[];
}

export interface ReactionRequest {
  emoji: string;
}

export interface ReactionToggleResult {
  toggled: "added" | "removed";
  reactions: ReactionGroup[];
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

// WebSocket payloads
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
}

export interface WsGroupUpdatedPayload {
  event: string;
  chatId: string;
  name?: string;
  avatar?: string;
  description?: string;
}

export interface WsReactionPayload {
  event: string;
  chatId: string;
  messageId: string;
  reactions: ReactionGroup[];
}

// Request types
export interface GetChatsRequest {
  search?: string;
  type?: ChatType;
  cursor?: string;
  limit?: number;
}

export interface GetMessagesRequest {
  cursor?: string;
  limit?: number;
}

export interface CreatePrivateChatRequest {
  targetUserId: string;
}

export interface CreateGroupChatRequest {
  name: string;
  description?: string;
  memberIds: string[];
  avatar?: File;
}

export interface SendMessageRequest {
  text: string;
  type?: MessageType;
  media?: File;
  replyToId?: string;
}

export interface DeleteMessagesRequest {
  messageIds: string[];
}

export interface ReadMessagesRequest {
  messageIds: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  avatar?: File;
}

export interface AddMembersRequest {
  userIds: string[];
}

export interface RemoveMemberRequest {
  userId: string;
}

export interface PromoteMemberRequest {
  userId: string;
}
