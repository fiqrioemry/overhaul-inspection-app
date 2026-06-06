export type ChatType = "PRIVATE" | "GROUP";
export type ParticipantRole = "MEMBER" | "ADMIN";
export type MessageType = "text" | "image" | "file";

export type participantData = {
  id: string;
  userId: string;
  role: ParticipantRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
};

export type messageReplyTo = {
  id: string;
  text: string;
  type: MessageType;
  sender: { id: string; name: string; username: string };
} | null;

export type messageData = {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string;
  mediaUrl: string | null;
  readBy: string[];
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  replyTo: messageReplyTo;
};

export type lastMessageData = {
  id: string;
  text: string;
  type: MessageType;
  senderId: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    username: string;
  };
} | null;

export type chatListItem = {
  id: string;
  type: ChatType;
  name: string | null;
  avatar: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: lastMessageData;
  participants: participantData[];
  _count: {
    participants: number;
    messages: number;
  };
};

export type chatDetailData = {
  id: string;
  type: ChatType;
  name: string | null;
  avatar: string | null;
  description: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: lastMessageData;
  participants: participantData[];
  _count: {
    participants: number;
    messages: number;
  };
};

export type createChatData = {
  type: ChatType;
  name?: string;
  avatar?: string;
  description?: string;
  createdById: string;
  participantIds: string[];
};

export type wsNewMessagePayload = {
  event: string;
  chatId: string;
  message: messageData;
};

export type wsMessageReadPayload = {
  event: string;
  chatId: string;
  messageIds: string[];
  readBy: string;
};

export type wsParticipantPayload = {
  event: string;
  chatId: string;
  userId: string;
  username: string;
};

export type wsGroupUpdatedPayload = {
  event: string;
  chatId: string;
  name?: string;
  avatar?: string;
  description?: string;
};
