import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";
import { createSessionData, sessionResponse } from "@/models/session.model";

export class SessionRepository {
  static async findSessionWithUser(sessionId: string): Promise<sessionResponse | null> {
    return await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async createSession(tx: Prisma.TransactionClient | null, sessions: createSessionData): Promise<{ id: string }> {
    const db = tx ?? prisma;
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
    return await prisma.session.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async findSessionsByUserId(userId: string): Promise<sessionResponse[]> {
    return await prisma.session.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
        user: {
          select: {
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });
  }

  static async deleteSessionsByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  static async deleteSessionBySessionId(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });
  }

  static async getSessionById(sessionId: string): Promise<{ id: string } | null> {
    return await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
      },
    });
  }
}
