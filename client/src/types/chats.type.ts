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
