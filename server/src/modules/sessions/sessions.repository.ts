import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/config/database/pgsql";
import { createSessionData, sessionResponse } from "@/modules/sessions/sessions.types";

export class SessionRepository {
  static async findSessionWithUser(sessionId: string): Promise<sessionResponse | null> {
    return await database.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async createSession(tx: Prisma.TransactionClient | null, sessions: createSessionData): Promise<{ id: string }> {
    const db = tx ?? database;
    // create session in the database
    const session = await db.session.create({
      data: {
        id: sessions.id,
        userId: sessions.userId,
        token: sessions.token,
        userAgent: sessions.userAgent,
        expiresAt: sessions.expiresAt,
      },
    });

    return { id: session.id };
  }

  static async findSessionByToken(token: string): Promise<sessionResponse | null> {
    return await database.session.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: {
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async findSessionsByUserId(userId: string): Promise<sessionResponse[]> {
    return await database.session.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async deleteSessionsByUserId(userId: string): Promise<void> {
    await database.session.deleteMany({
      where: { userId },
    });
  }

  static async deleteSessionBySessionId(sessionId: string): Promise<void> {
    await database.session.delete({
      where: { id: sessionId },
    });
  }

  static async getSessionById(sessionId: string): Promise<{ id: string } | null> {
    return await database.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
      },
    });
  }
}
