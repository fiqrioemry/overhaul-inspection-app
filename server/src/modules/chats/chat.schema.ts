// src/modules/chat/chat.schema.ts

import { z } from "zod";

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
  text: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  type: z.enum(["text", "image", "file"]).default("text"),
  mediaUrl: z.string().url("Invalid media URL").optional(),
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
  memberIds: z.array(z.string().cuid("Invalid user ID")).min(1, "At least one member ID is required").max(50, "Cannot add more than 50 members at once"),
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
