export const CHAT_ENDPOINTS = {
  // Chat list & creation
  getMyChats: "/chats",
  createPrivateChat: "/chats/private",
  createGroupChat: "/chats/group",

  // Single chat
  getChatById: "/chats/:chatId",

  // Messages
  getMessages: "/chats/:chatId/messages",
  sendMessage: "/chats/:chatId/messages",
  deleteMessages: "/chats/:chatId/messages",
  readMessages: "/chats/:chatId/messages/read",

  // Group management
  updateGroup: "/chats/:chatId/group",
  addMembers: "/chats/:chatId/members",
  removeMember: "/chats/:chatId/members",
  leaveGroup: "/chats/:chatId/leave",
  promoteMember: "/chats/:chatId/members/promote",
  demoteMember: "/chats/:chatId/members/demote",
} as const;

export const CHAT_WS_EVENTS = {
  NEW_MESSAGE: "new_message",
  MESSAGE_READ: "message_read",
  PARTICIPANT_JOINED: "participant_joined",
  PARTICIPANT_LEFT: "participant_left",
  GROUP_UPDATED: "group_updated",
} as const;

export const CHAT_LIMITS = {
  MESSAGE_MAX_LENGTH: 2000,
  GROUP_NAME_MAX: 80,
  GROUP_DESCRIPTION_MAX: 200,
  MAX_MEMBERS: 100,
  MESSAGES_PER_PAGE: 30,
  CHATS_PER_PAGE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp", "pdf", "mp4", "mp3"],
  ALLOWED_FILE_TYPES: ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "audio/mpeg"],
} as const;
