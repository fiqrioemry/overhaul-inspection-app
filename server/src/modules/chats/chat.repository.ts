// src/modules/chat/chat.repository.ts

import { Prisma } from "generated/prisma";
import { pgsql as database } from "@/lib/database";
import type { chatDetailData, chatListItem, createChatData, messageData, participantData } from "@/modules/chats/chat.types";
import type { GetChatsRequest, GetMessagesRequest, SendMessageRequest, UpdateGroupRequest } from "@/modules/chats/chat.schema";

const participantSelect = {
  id: true,
  userId: true,
  role: true,
  joinedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
    },
  },
} satisfies Prisma.ChatParticipantSelect;

const lastMessageSelect = {
  id: true,
  text: true,
  type: true,
  senderId: true,
  createdAt: true,
  sender: {
    select: {
      id: true,
      name: true,
      username: true,
    },
  },
} satisfies Prisma.MessageSelect;

const chatListSelect = {
  id: true,
  type: true,
  name: true,
  avatar: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  lastMessage: { select: lastMessageSelect },
  participants: { select: participantSelect },
  _count: {
    select: {
      participants: true,
      messages: true,
    },
  },
} satisfies Prisma.ChatSelect;

export class ChatRepository {
  static async createChat(tx: Prisma.TransactionClient | null, data: createChatData): Promise<{ id: string }> {
    const db = tx ?? database;

    return db.chat.create({
      data: {
        type: data.type,
        name: data.name,
        avatar: data.avatar,
        description: data.description,
        createdById: data.createdById,
        participants: {
          create: data.participantIds.map((userId, index) => ({
            userId,
            // creator (index 0) is always ADMIN for groups
            role: data.type === "GROUP" && index === 0 ? "ADMIN" : "MEMBER",
          })),
        },
      },
      select: { id: true },
    });
  }

  static async findChatById(chatId: string): Promise<chatDetailData | null> {
    return database.chat.findFirst({
      where: { id: chatId, deletedAt: null },
      select: {
        ...chatListSelect,
        createdById: true,
      },
    }) as Promise<chatDetailData | null>;
  }

  static async findPrivateChatBetween(userAId: string, userBId: string): Promise<{ id: string } | null> {
    // A private chat where both users are participants
    return database.chat.findFirst({
      where: {
        type: "PRIVATE",
        deletedAt: null,
        participants: {
          every: {
            userId: { in: [userAId, userBId] },
          },
        },
        AND: [{ participants: { some: { userId: userAId } } }, { participants: { some: { userId: userBId } } }],
        _count: {
          participants: 2,
        },
      },
      select: { id: true },
    });
  }

  static async findPrivateChatBetweenExact(userAId: string, userBId: string): Promise<{ id: string } | null> {
    // Use raw query for exact 2-participant private chat check
    const result = await database.$queryRaw<{ id: string }[]>`
      SELECT c.id
      FROM chats c
      WHERE c.type = 'PRIVATE'
        AND c.deleted_at IS NULL
        AND (
          SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id
        ) = 2
        AND EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = ${userAId})
        AND EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = ${userBId})
      LIMIT 1
    `;
    return result[0] ?? null;
  }

  static async getChatsByUserId(userId: string, query: GetChatsRequest): Promise<{ results: chatListItem[]; totalItems: number }> {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);

    const where: Prisma.ChatWhereInput = {
      deletedAt: null,
      participants: {
        some: { userId },
      },
    };

    const [results, totalItems] = await Promise.all([
      database.chat.findMany({
        where,
        select: chatListSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      database.chat.count({ where }),
    ]);

    return { results: results as chatListItem[], totalItems };
  }

  static async softDeleteChat(tx: Prisma.TransactionClient | null, chatId: string): Promise<void> {
    const db = tx ?? database;
    await db.chat.update({
      where: { id: chatId },
      data: { deletedAt: new Date() },
    });
  }

  static async updateGroupInfo(tx: Prisma.TransactionClient | null, chatId: string, data: UpdateGroupRequest & { avatar?: string }): Promise<void> {
    const db = tx ?? database;
    await db.chat.update({
      where: { id: chatId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
    });
  }

  static async updateLastMessage(tx: Prisma.TransactionClient | null, chatId: string, messageId: string): Promise<void> {
    const db = tx ?? database;
    await db.chat.update({
      where: { id: chatId },
      data: { lastMessageId: messageId },
    });
  }

  // ─── Participant ─────────────────────────────────────────────────────────────

  static async findParticipant(chatId: string, userId: string): Promise<{ id: string; role: string } | null> {
    return database.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { id: true, role: true },
    });
  }

  static async getParticipants(chatId: string): Promise<participantData[]> {
    return database.chatParticipant.findMany({
      where: { chatId },
      select: participantSelect,
    }) as Promise<participantData[]>;
  }

  static async addParticipants(tx: Prisma.TransactionClient | null, chatId: string, userIds: string[]): Promise<void> {
    const db = tx ?? database;
    await db.chatParticipant.createMany({
      data: userIds.map((userId) => ({ chatId, userId, role: "MEMBER" })),
      skipDuplicates: true,
    });
  }

  static async removeParticipant(tx: Prisma.TransactionClient | null, chatId: string, userId: string): Promise<void> {
    const db = tx ?? database;
    await db.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId } },
    });
  }

  static async updateParticipantRole(tx: Prisma.TransactionClient | null, chatId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<void> {
    const db = tx ?? database;
    await db.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { role },
    });
  }

  static async countParticipants(chatId: string): Promise<number> {
    return database.chatParticipant.count({ where: { chatId } });
  }

  static async countAdmins(chatId: string): Promise<number> {
    return database.chatParticipant.count({
      where: { chatId, role: "ADMIN" },
    });
  }

  static async getParticipantsByIds(chatId: string, userIds: string[]): Promise<{ userId: string }[]> {
    return database.chatParticipant.findMany({
      where: { chatId, userId: { in: userIds } },
      select: { userId: true },
    });
  }

  // ─── Messages ────────────────────────────────────────────────────────────────

  static async createMessage(tx: Prisma.TransactionClient | null, chatId: string, senderId: string, data: SendMessageRequest): Promise<messageData> {
    const db = tx ?? database;
    return db.message.create({
      data: {
        chatId,
        senderId,
        type: data.type ?? "text",
        text: data.text,
        mediaUrl: data.mediaUrl,
        readBy: [senderId], // sender auto-reads their own message
      },
      select: {
        id: true,
        chatId: true,
        senderId: true,
        type: true,
        text: true,
        mediaUrl: true,
        readBy: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    }) as Promise<messageData>;
  }

  static async getMessages(chatId: string, query: GetMessagesRequest): Promise<{ results: messageData[]; hasMore: boolean }> {
    const limit = Number(query.limit ?? 30);

    const results = (await database.message.findMany({
      where: {
        chatId,
        ...(query.cursor && {
          createdAt: {
            lt: (
              await database.message.findUnique({
                where: { id: query.cursor },
                select: { createdAt: true },
              })
            )?.createdAt,
          },
        }),
      },
      select: {
        id: true,
        chatId: true,
        senderId: true,
        type: true,
        text: true,
        mediaUrl: true,
        readBy: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // fetch one extra to determine hasMore
    })) as messageData[];

    const hasMore = results.length > limit;
    if (hasMore) results.pop();

    return { results, hasMore };
  }

  static async markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<number> {
    if (messageIds.length === 0) return 0;

    const result = await database.$executeRaw`
    UPDATE messages
    SET read_by = array_append(read_by, ${userId})
    WHERE id = ANY(${messageIds}::text[])
      AND chat_id = ${chatId}
      AND NOT (${userId} = ANY(read_by))
  `;

    return result;
  }

  static async countUnreadMessages(chatId: string, userId: string): Promise<number> {
    const result = await database.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::int AS count
    FROM messages
    WHERE chat_id = ${chatId}
      AND NOT (${userId} = ANY(read_by))
  `;

    return Number(result[0]?.count ?? 0);
  }
}
