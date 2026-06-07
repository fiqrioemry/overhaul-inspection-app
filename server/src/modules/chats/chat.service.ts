import type {
  GetChatsRequest,
  AddMembersRequest,
  GetMessagesRequest,
  SendMessageRequest,
  UpdateGroupRequest,
  RemoveMemberRequest,
  ReadMessagesRequest,
  PromoteMemberRequest,
  CreateGroupChatRequest,
  CreatePrivateChatRequest,
  DeleteMessagesRequest,
  ReactionRequest,
} from "@/modules/chats/chat.schema";
import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { eventBus } from "@/lib/socket";
import { HTTPException } from "hono/http-exception";
import { NotificationType } from "generated/prisma";
import { FileService } from "@/modules/files/file.service";
import { createFileData } from "@/modules/files/file.types";
import { UserRepository } from "@/modules/users/user.repository";
import { ChatRepository } from "@/modules/chats/chat.repository";
import { NotificationRepository } from "@/modules/notifications/notification.repository";
import { chatErrorCode, chatErrorMessage, chatSuccessMessage, chatWsEvent } from "@/config/constant/chat.constant";
import type { reactionToggleResult } from "@/modules/chats/chat.types";

export class ChatService {
  private static async assertParticipant(chatId: string, userId: string) {
    const participant = await ChatRepository.findParticipant(chatId, userId);
    if (!participant) {
      throw new HTTPException(403, {
        message: chatErrorMessage.NOT_A_PARTICIPANT,
        cause: chatErrorCode.NOT_A_PARTICIPANT,
      });
    }
    return participant;
  }

  private static async assertAdmin(chatId: string, userId: string) {
    const participant = await ChatRepository.findParticipant(chatId, userId);
    if (!participant || participant.role !== "ADMIN") {
      throw new HTTPException(403, {
        message: chatErrorMessage.NOT_AN_ADMIN,
        cause: chatErrorCode.NOT_AN_ADMIN,
      });
    }
    return participant;
  }

  private static async assertChatExists(chatId: string) {
    const chat = await ChatRepository.findChatById(chatId);
    if (!chat) {
      throw new HTTPException(404, {
        message: chatErrorMessage.CHAT_NOT_FOUND,
        cause: chatErrorCode.CHAT_NOT_FOUND,
      });
    }
    return chat;
  }

  private static async assertGroupChat(chatId: string) {
    const chat = await ChatRepository.findChatById(chatId);
    if (!chat) {
      throw new HTTPException(404, {
        message: chatErrorMessage.CHAT_NOT_FOUND,
        cause: chatErrorCode.CHAT_NOT_FOUND,
      });
    }
    if (chat.type !== "GROUP") {
      throw new HTTPException(400, {
        message: chatErrorMessage.NOT_A_GROUP,
        cause: chatErrorCode.NOT_A_GROUP,
      });
    }
    return chat;
  }

  static async createPrivateChat(_c: Context, userId: string, request: CreatePrivateChatRequest) {
    if (userId === request.targetUserId) {
      throw new HTTPException(400, {
        message: chatErrorMessage.CANNOT_ADD_SELF,
        cause: chatErrorCode.CANNOT_ADD_SELF,
      });
    }

    const targetUser = await UserRepository.findById(request.targetUserId);
    if (!targetUser) {
      throw new HTTPException(404, {
        message: chatErrorMessage.USER_NOT_FOUND,
        cause: chatErrorCode.USER_NOT_FOUND,
      });
    }

    const existing = await ChatRepository.findPrivateChatBetweenExact(userId, request.targetUserId);
    if (existing) {
      // Return existing chat instead of creating duplicate
      return ChatRepository.findChatById(existing.id);
    }

    const chat = await ChatRepository.createChat(null, {
      type: "PRIVATE",
      createdById: userId,
      participantIds: [userId, request.targetUserId],
    });

    return ChatRepository.findChatById(chat.id);
  }

  static async createGroupChat(_c: Context, userId: string, request: CreateGroupChatRequest) {
    const uniqueMemberIds = [...new Set(request.memberIds.filter((id) => id !== userId))];

    if (uniqueMemberIds.length < 2) {
      throw new HTTPException(400, {
        message: chatErrorMessage.MIN_GROUP_MEMBERS,
        cause: chatErrorCode.MIN_GROUP_MEMBERS,
      });
    }

    if (uniqueMemberIds.length > 99) {
      throw new HTTPException(400, {
        message: chatErrorMessage.MAX_GROUP_MEMBERS,
        cause: chatErrorCode.MAX_GROUP_MEMBERS,
      });
    }

    // Verify all target users exist
    const users = await Promise.all(uniqueMemberIds.map((id) => UserRepository.findById(id)));
    if (users.some((u) => !u)) {
      throw new HTTPException(404, {
        message: chatErrorMessage.USER_NOT_FOUND,
        cause: chatErrorCode.USER_NOT_FOUND,
      });
    }

    // Creator goes first so they get ADMIN role (see repository)
    const participantIds = [userId, ...uniqueMemberIds];

    const chat = await ChatRepository.createChat(null, {
      type: "GROUP",
      name: request.name,
      description: request.description,
      createdById: userId,
      participantIds,
    });

    return ChatRepository.findChatById(chat.id);
  }

  static async getMyChats(userId: string, query: GetChatsRequest) {
    const { results, totalItems } = await ChatRepository.getChatsByUserId(userId, query);

    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    // Compute unread count per chat
    const enriched = await Promise.all(
      results.map(async (chat) => {
        const unreadCount = await ChatRepository.countUnreadMessages(chat.id, userId);
        return { ...chat, unreadCount };
      }),
    );

    return {
      data: enriched,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  static async getChatById(chatId: string, userId: string) {
    const chat = await this.assertChatExists(chatId);
    await this.assertParticipant(chatId, userId);

    const unreadCount = await ChatRepository.countUnreadMessages(chatId, userId);
    return { ...chat, unreadCount };
  }

  static async getMessages(chatId: string, userId: string, query: GetMessagesRequest) {
    await this.assertChatExists(chatId);
    await this.assertParticipant(chatId, userId);

    const { results, hasMore } = await ChatRepository.getMessages(chatId, query);

    return {
      data: results,
      meta: {
        pagination: { hasMore, nextCursor: hasMore ? results[results.length - 1]?.id : null },
      },
    };
  }

  static async sendMessage(c: Context, request: SendMessageRequest) {
    const { chatId, senderId } = request;
    await this.assertChatExists(chatId!);
    await this.assertParticipant(chatId!, senderId!);

    const message = await pgsql.$transaction(async (tx) => {
      let fileRecord: createFileData = {};
      if (request.media) {
        fileRecord = await FileService.generateFileRecord(request.media, "chats");
        request.mediaUrl = fileRecord.url;
      }

      const msg = await ChatRepository.createMessage(tx, request);

      if (request.media) {
        fileRecord.targetId = msg.id;
        fileRecord.isUsed = true;
        await FileService.saveRecordToDatabase(fileRecord, tx);
        await FileService.uploadFileToStorage(c, fileRecord);
      }

      await ChatRepository.updateLastMessage(tx, chatId!, msg.id);

      return msg;
    });

    // Broadcast via WebSocket to all participants
    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.NEW_MESSAGE,
      chatId,
      message,
    });

    // Notify offline participants via notification system
    const participants = await ChatRepository.getParticipants(chatId!);
    const others = participants.filter((p) => p.userId !== senderId!);

    await Promise.allSettled(
      others.map((p) =>
        NotificationRepository.createNotification(pgsql, {
          userId: p.userId,
          type: NotificationType.MESSAGE,
          title: "New message",
          description: `You have a new message`,
          metadata: { chatId, messageId: message?.id, senderId },
        }),
      ),
    );

    return message;
  }

  static async readMessages(chatId: string, userId: string, request: ReadMessagesRequest) {
    await this.assertChatExists(chatId);
    await this.assertParticipant(chatId, userId);

    const count = await ChatRepository.markMessagesAsRead(chatId, userId, request.messageIds);

    if (count > 0) {
      eventBus.publish(`chat:${chatId}`, {
        event: chatWsEvent.MESSAGE_READ,
        chatId,
        messageIds: request.messageIds,
        readBy: userId,
      });
    }

    return { updatedCount: count };
  }

  static async updateGroup(_c: Context, chatId: string, userId: string, request: UpdateGroupRequest) {
    await this.assertGroupChat(chatId);
    await this.assertAdmin(chatId, userId);

    await ChatRepository.updateGroupInfo(null, chatId, request);

    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.GROUP_UPDATED,
      chatId,
      ...request,
    });

    return ChatRepository.findChatById(chatId);
  }

  static async addMembers(_c: Context, chatId: string, userId: string, request: AddMembersRequest) {
    await this.assertGroupChat(chatId);
    await this.assertAdmin(chatId, userId);

    const selfFiltered = request.userIds.filter((id) => id !== userId);

    if (selfFiltered.includes(userId)) {
      throw new HTTPException(400, {
        message: chatErrorMessage.CANNOT_ADD_SELF,
        cause: chatErrorCode.CANNOT_ADD_SELF,
      });
    }

    const currentCount = await ChatRepository.countParticipants(chatId);
    if (currentCount + selfFiltered.length > 100) {
      throw new HTTPException(400, {
        message: chatErrorMessage.MAX_GROUP_MEMBERS,
        cause: chatErrorCode.MAX_GROUP_MEMBERS,
      });
    }

    // Verify users exist
    const users = await Promise.all(selfFiltered.map((id) => UserRepository.findById(id)));
    if (users.some((u) => !u)) {
      throw new HTTPException(404, {
        message: chatErrorMessage.USER_NOT_FOUND,
        cause: chatErrorCode.USER_NOT_FOUND,
      });
    }

    // Filter already-in users
    const alreadyIn = await ChatRepository.getParticipantsByIds(chatId, selfFiltered);
    const alreadyInIds = new Set(alreadyIn.map((p) => p.userId));
    const toAdd = selfFiltered.filter((id) => !alreadyInIds.has(id));

    if (toAdd.length === 0) {
      throw new HTTPException(409, {
        message: chatErrorMessage.ALREADY_A_PARTICIPANT,
        cause: chatErrorCode.ALREADY_A_PARTICIPANT,
      });
    }

    await ChatRepository.addParticipants(null, chatId, toAdd);

    toAdd.forEach((newUserId) => {
      eventBus.publish(`chat:${chatId}`, {
        event: chatWsEvent.PARTICIPANT_JOINED,
        chatId,
        userId: newUserId,
      });
    });

    return ChatRepository.getParticipants(chatId);
  }

  static async removeMember(_c: Context, chatId: string, adminId: string, request: RemoveMemberRequest) {
    await this.assertGroupChat(chatId);
    await this.assertAdmin(chatId, adminId);

    if (request.userId === adminId) {
      throw new HTTPException(400, {
        message: chatErrorMessage.CANNOT_REMOVE_SELF,
        cause: chatErrorCode.CANNOT_REMOVE_SELF,
      });
    }

    const target = await ChatRepository.findParticipant(chatId, request.userId);
    if (!target) {
      throw new HTTPException(404, {
        message: chatErrorMessage.NOT_A_PARTICIPANT,
        cause: chatErrorCode.NOT_A_PARTICIPANT,
      });
    }

    if (target.role === "ADMIN") {
      throw new HTTPException(400, {
        message: chatErrorMessage.CANNOT_REMOVE_ADMIN,
        cause: chatErrorCode.CANNOT_REMOVE_ADMIN,
      });
    }

    await ChatRepository.removeParticipant(null, chatId, request.userId);

    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.PARTICIPANT_LEFT,
      chatId,
      userId: request.userId,
    });
  }

  static async leaveGroup(chatId: string, userId: string) {
    await this.assertGroupChat(chatId);
    await this.assertParticipant(chatId, userId);

    const participant = await ChatRepository.findParticipant(chatId, userId);

    if (participant?.role === "ADMIN") {
      const adminCount = await ChatRepository.countAdmins(chatId);
      if (adminCount <= 1) {
        await ChatRepository.deleteChat(chatId);
      }
    }

    await ChatRepository.removeParticipant(null, chatId, userId);

    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.PARTICIPANT_LEFT,
      chatId,
      userId,
    });
  }

  static async promoteMember(_c: Context, chatId: string, adminId: string, request: PromoteMemberRequest) {
    await this.assertGroupChat(chatId);
    await this.assertAdmin(chatId, adminId);

    const target = await ChatRepository.findParticipant(chatId, request.userId);
    if (!target) {
      throw new HTTPException(404, {
        message: chatErrorMessage.NOT_A_PARTICIPANT,
        cause: chatErrorCode.NOT_A_PARTICIPANT,
      });
    }

    await ChatRepository.updateParticipantRole(null, chatId, request.userId, "ADMIN");
  }

  static async demoteMember(_c: Context, chatId: string, adminId: string, request: PromoteMemberRequest) {
    await this.assertGroupChat(chatId);
    await this.assertAdmin(chatId, adminId);

    if (request.userId === adminId) {
      throw new HTTPException(400, {
        message: chatErrorMessage.CANNOT_DEMOTE_SELF,
        cause: chatErrorCode.CANNOT_DEMOTE_SELF,
      });
    }

    const target = await ChatRepository.findParticipant(chatId, request.userId);
    if (!target) {
      throw new HTTPException(404, {
        message: chatErrorMessage.NOT_A_PARTICIPANT,
        cause: chatErrorCode.NOT_A_PARTICIPANT,
      });
    }

    await ChatRepository.updateParticipantRole(null, chatId, request.userId, "MEMBER");
  }

  static async deleteMessages(c: Context, request: DeleteMessagesRequest) {
    await this.assertChatExists(request.chatId!);
    await this.assertParticipant(request.chatId!, request.senderId!);
    const results = await ChatRepository.getMessagesByIds(request.messageIds, request.senderId!);
    const foundIds = new Set(results.map((m) => m.id));
    const notFoundIds = request.messageIds.filter((id) => !foundIds.has(id));
    if (notFoundIds.length > 0) {
      throw new HTTPException(404, {
        message: chatErrorMessage.MESSAGE_NOT_FOUND,
        cause: chatErrorCode.MESSAGE_NOT_FOUND,
      });
    }
    const fileToDelete = results.filter((m) => m.mediaUrl).map((m) => m.id);
    for (const targetId of fileToDelete) {
      const file = await FileService.getFileRecordByTargetId(targetId, "chats");
      if (file) {
        await FileService.deleteFile(c, file.id);
      }
      await ChatRepository.deleteMessages(request.chatId!, request.senderId!, request.messageIds);
    }
  }
  static async countUnreadMessages(userId: string) {
    const count = await ChatRepository.countTotalUnreadMessages(userId);
    return { unreadCount: count };
  }

  // ─── Reactions ───────────────────────────────────────────────────────────────

  static async addReaction(userId: string, chatId: string, messageId: string, request: ReactionRequest): Promise<reactionToggleResult> {
    await this.assertParticipant(chatId, userId);

    const message = await ChatRepository.findMessageInChat(messageId);
    if (!message) {
      throw new HTTPException(404, { message: chatErrorMessage.MESSAGE_NOT_FOUND, cause: chatErrorCode.MESSAGE_NOT_FOUND });
    }
    if (message.chatId !== chatId) {
      throw new HTTPException(400, { message: chatErrorMessage.MESSAGE_NOT_IN_CHAT, cause: chatErrorCode.MESSAGE_NOT_IN_CHAT });
    }

    const existing = await ChatRepository.findReaction(messageId, userId, request.emoji);
    if (existing) {
      await ChatRepository.removeReaction(messageId, userId, request.emoji);
    } else {
      await ChatRepository.addReaction(messageId, userId, request.emoji);
    }

    const reactions = await ChatRepository.getReactionsByMessageId(messageId);

    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.REACTION_UPDATED,
      chatId,
      messageId,
      reactions,
    });

    return { toggled: existing ? "removed" : "added", reactions };
  }

  static async removeReaction(userId: string, chatId: string, messageId: string, request: ReactionRequest) {
    await this.assertParticipant(chatId, userId);

    const message = await ChatRepository.findMessageInChat(messageId);
    if (!message) {
      throw new HTTPException(404, { message: chatErrorMessage.MESSAGE_NOT_FOUND, cause: chatErrorCode.MESSAGE_NOT_FOUND });
    }
    if (message.chatId !== chatId) {
      throw new HTTPException(400, { message: chatErrorMessage.MESSAGE_NOT_IN_CHAT, cause: chatErrorCode.MESSAGE_NOT_IN_CHAT });
    }

    const existing = await ChatRepository.findReaction(messageId, userId, request.emoji);
    if (!existing) {
      throw new HTTPException(404, { message: chatErrorMessage.REACTION_NOT_FOUND, cause: chatErrorCode.REACTION_NOT_FOUND });
    }

    await ChatRepository.removeReaction(messageId, userId, request.emoji);

    const reactions = await ChatRepository.getReactionsByMessageId(messageId);

    eventBus.publish(`chat:${chatId}`, {
      event: chatWsEvent.REACTION_UPDATED,
      chatId,
      messageId,
      reactions,
    });

    return reactions;
  }
}
