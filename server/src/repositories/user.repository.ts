import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";
import { CreateUserActivityLogRequest, UpdateProfileRequest } from "@/schema/user.validation";
import { createUserData, searchResponse, verificationType, createVerificationData, updateUserActiveData, userCredential, userResponse, userVerificationData, profileResponse } from "@/models/user.model";

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
      },
    });
  }

  static async getProfileByUsername(username: string): Promise<profileResponse | null> {
    return await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        name: true,
        isPublic: true,
        username: true,
        avatar: true,
        bio: true,
        lastLogin: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true,
          },
        },
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

  static async updateUserVerification(tx: Prisma.TransactionClient | null, verificationId: string, usedAt: Date): Promise<void> {
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

  static async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  static async updateProfile(userId: string, request: UpdateProfileRequest): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { name: request.name, bio: request.bio },
    });
  }
  static async searchUsersByUsername(username: string): Promise<searchResponse[]> {
    return await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
      },
      take: 10,
      orderBy: {
        username: "asc",
      },
    });
  }

  static async getUserByUsername(username: string): Promise<{ id: string } | null> {
    return await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
      },
    });
  }

  static async createActivityLog(tx: Prisma.TransactionClient | null, request: CreateUserActivityLogRequest): Promise<void> {
    const db = tx ?? prisma;
    await db.userActivityLog.create({
      data: {
        userId: request.userId,
        action: request.action,
        metadata: request.metadata,
      },
    });
  }
}
