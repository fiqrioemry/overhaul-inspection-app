import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";
import { createUserData, verificationType, createVerificationData, updateUserActiveData, userCredential, userResponse, userVerificationData } from "@/models/user.model";

export class UserRepository {
  static async findByEmail(email: string): Promise<userCredential | null> {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
        verifiedAt: true,
      },
    });
  }

  static async create(tx: Prisma.TransactionClient | null, user: createUserData): Promise<userResponse> {
    const db = tx ?? prisma;

    const result = await db.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        status: "INACTIVE",
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        verifiedAt: true,
      },
    });

    return result;
  }

  static async findById(id: string): Promise<userResponse | null> {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        bio: true,
        status: true,
        lastLogin: true,
        createdAt: true,
        verifiedAt: true,
      },
    });
  }

  static async createUserVerification(tx: Prisma.TransactionClient | null, verificationData: createVerificationData): Promise<void> {
    const db = tx ?? prisma;

    await db.userVerification.create({
      data: {
        userId: verificationData.userId,
        token: verificationData.token,
        type: verificationData.type,
        expiresAt: verificationData.expiresAt,
      },
    });
  }

  static async findUserVerification(token: string, type: verificationType): Promise<userVerificationData | null> {
    return await prisma.userVerification.findFirst({
      where: { token, type, usedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        userId: true,
        token: true,
        type: true,
        expiresAt: true,
      },
    });
  }

  static async UpdateUserVerification(tx: Prisma.TransactionClient | null, verificationId: string, usedAt: Date): Promise<void> {
    const db = tx ?? prisma;

    await db.userVerification.update({
      where: { id: verificationId },
      data: {
        usedAt,
      },
    });
  }

  static async updateLastLogin(tx: Prisma.TransactionClient | null, userId: string, lastLogin: Date): Promise<void> {
    const db = tx ?? prisma;
    await db.user.update({
      where: { id: userId },
      data: { lastLogin },
    });
  }

  static async updateUserActive(tx: Prisma.TransactionClient | null, user: updateUserActiveData): Promise<void> {
    const db = tx ?? prisma;
    await db.user.update({
      where: { id: user.userId },
      data: { status: user.status, verifiedAt: new Date() },
    });
  }

  static async deleteSessionBySessionId(tx: Prisma.TransactionClient | null, sessionId: string): Promise<void> {
    const db = tx ?? prisma;
    await db.session.delete({
      where: { id: sessionId },
    });
  }

  static async getPasswordByUserId(userId: string): Promise<string | null> {
    const result = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    return result?.passwordHash || null;
  }

  static async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }
}
