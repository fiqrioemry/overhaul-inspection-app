// src/modules/chat/chat.schema.ts

import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_CHAT_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",

  // PDF
  "application/pdf",

  // Video
  "video/mp4",

  // Audio
  "audio/mpeg",
  "audio/wav",

  // DOCX
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // XLSX
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const chatFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
  .refine((f) => ALLOWED_CHAT_TYPES.includes(f.type), "Only JPEG, PNG, WebP, PDF, MP4, and MPEG are allowed");

export const createPrivateChatRequest = z.object({
  targetUserId: z.string().cuid("Invalid user ID"),
});
export type CreatePrivateChatRequest = z.infer<typeof createPrivateChatRequest>;

export const createGroupChatRequest = z.object({
  name: z.string().min(1, "Group name is required").max(80, "Group name must be at most 80 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
  memberIds: z.array(z.string().cuid("Invalid user ID")).min(2, "Group requires at least 2 other members").max(99, "Group cannot exceed 99 additional members"),
});
export type CreateGroupChatRequest = z.infer<typeof createGroupChatRequest>;

export const sendMessageRequest = z.object({
  chatId: z.string().cuid("Invalid chat ID").optional(), // will be set in controller
  senderId: z.string().cuid("Invalid user ID").optional(), // will be set in controller
  text: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  type: z.enum(["text", "image", "file", "audio"]).default("text"),
  media: chatFileSchema.optional(),
  mediaUrl: z.string().url("Invalid media URL").optional(), // for already uploaded media
});
export type SendMessageRequest = z.infer<typeof sendMessageRequest>;

export const getMessagesRequest = z.object({
  cursor: z.string().optional(), // message id — cursor-based pagination
  limit: z.string().default("30").optional(),
});
export type GetMessagesRequest = z.infer<typeof getMessagesRequest>;

export const getChatsRequest = z.object({
  page: z.string().default("1").optional(),
  limit: z.string().default("20").optional(),
});
export type GetChatsRequest = z.infer<typeof getChatsRequest>;

export const updateGroupRequest = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(200).optional(),
});
export type UpdateGroupRequest = z.infer<typeof updateGroupRequest>;

export const addMembersRequest = z.object({
  userIds: z.array(z.string().cuid("Invalid user ID")).min(1, "At least one member ID is required").max(50, "Cannot add more than 50 members at once"),
});
export type AddMembersRequest = z.infer<typeof addMembersRequest>;

export const removeMemberRequest = z.object({
  userId: z.string().cuid("Invalid user ID"),
});
export type RemoveMemberRequest = z.infer<typeof removeMemberRequest>;

export const promoteMemberRequest = z.object({
  userId: z.string().cuid("Invalid user ID"),
});
export type PromoteMemberRequest = z.infer<typeof promoteMemberRequest>;

export const readMessagesRequest = z.object({
  messageIds: z.array(z.string().cuid("Invalid message ID")).min(1),
});
export type ReadMessagesRequest = z.infer<typeof readMessagesRequest>;

export const deleteMessagesRequest = z.object({
  chatId: z.string().cuid("Invalid chat ID").optional(), // will be set in controller
  senderId: z.string().cuid("Invalid user ID").optional(), // will be set in controller
  messageIds: z.array(z.string().cuid("Invalid message ID")).min(1),
});

export type DeleteMessagesRequest = z.infer<typeof deleteMessagesRequest>;
