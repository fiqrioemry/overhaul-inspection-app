export const CHAT_ENDPOINTS = {
  getMyChats: "/chats",
  createPrivateChat: "/chats/private",
  createGroupChat: "/chats/group",
  getChatById: "/chats/:chatId",
  getMessages: "/chats/:chatId/messages",
  sendMessage: "/chats/:chatId/messages",
  deleteMessages: "/chats/:chatId/messages",
  readMessages: "/chats/:chatId/messages/read",
  updateGroup: "/chats/:chatId/group",
  addMembers: "/chats/:chatId/members",
  removeMember: "/chats/:chatId/members",
  leaveGroup: "/chats/:chatId/leave",
  promoteMember: "/chats/:chatId/members/promote",
  demoteMember: "/chats/:chatId/members/demote",
  getUnreadMessagesCount: "/chats/unread-count",
} as const;

export const CHAT_WS_EVENTS = {
  NEW_MESSAGE: "new_message",
  MESSAGE_READ: "message_read",
  GROUP_UPDATED: "group_updated",
  PARTICIPANT_JOINED: "participant_joined",
  PARTICIPANT_LEFT: "participant_left",
} as const;

export const CHAT_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "audio/mpeg",
    "audio/ogg",
    "audio/wav",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp3", ".ogg", ".wav", ".pdf", ".txt", ".doc", ".docx"],
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_MEMBERS: 100,
  MESSAGES_PER_PAGE: 30,
} as const;
