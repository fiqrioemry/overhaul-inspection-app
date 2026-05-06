import db from "@/config/database/mysql";
import { prisma } from "@/config/database/prisma";
import { SessionResponse } from "@/schema/session.validation";

export class SessionRepository {
  static async findSessionWithUser(sessionId: string): Promise<SessionResponse | null> {
    return await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  static async createSession(sessions: { id: string; userId: string; token: string; userAgent: string; expiresAt: Date }): Promise<{ id: string }> {
    // create session in the database
    const session = await prisma.session.create({
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

  static async findSessionByToken(token: string): Promise<SessionResponse | null> {
    return await prisma.session.findUnique({
      where: { token },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        user: {
          select: {
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  static async deleteSessionByToken(token: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { token },
    });
  }

  static async deleteSessionsByUserId(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }
}
