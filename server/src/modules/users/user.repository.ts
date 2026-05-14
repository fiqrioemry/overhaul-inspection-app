import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/config/database/pgsql";
import { CreateUserActivityLogRequest, UpdateProfileRequest } from "@/modules/users/user.schema";
import { createUserData, searchResponse, verificationType, createVerificationData, updateUserActiveData, userCredential, userResponse, userVerificationData, profileResponse } from "@/models/user.model";

export class UserRepository {
  static async findByEmail(email: string): Promise<userCredential | null> {
    return await database.user.findUnique({
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
    const db = tx ?? database;

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
    return await database.user.findUnique({
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

  static async getProfileByUsername(username: string, currentUserId?: string): Promise<profileResponse | null> {
    return await database.user.findUnique({
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
        followers: {
          where: { followerId: currentUserId ?? "" },
          select: { id: true },
        },
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
    const db = tx ?? database;

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
    return await database.userVerification.findFirst({
      where: { token, type, usedAt: null },
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
    const db = tx ?? database;

    await db.userVerification.update({
      where: { id: verificationId },
      data: {
        usedAt,
      },
    });
  }

  static async updateLastLogin(tx: Prisma.TransactionClient | null, userId: string, lastLogin: Date): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: userId },
      data: { lastLogin },
    });
  }

  static async updateUserActive(tx: Prisma.TransactionClient | null, user: updateUserActiveData): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: user.userId },
      data: { status: user.status, verifiedAt: new Date() },
    });
  }

  static async deleteSessionBySessionId(tx: Prisma.TransactionClient | null, sessionId: string): Promise<void> {
    const db = tx ?? database;
    await db.session.delete({
      where: { id: sessionId },
    });
  }

  static async getPasswordByUserId(userId: string): Promise<string | null> {
    const result = await database.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
      },
    });

    return result?.passwordHash || null;
  }

  static async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await database.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  static async updateAvatar(userId: string, avatarUrl: string, tx: Prisma.TransactionClient | null = null): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  static async updateProfile(userId: string, request: UpdateProfileRequest, tx: Prisma.TransactionClient | null = null): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: userId },
      data: { name: request.name, bio: request.bio },
    });
  }

  static async searchUsersByUsername(username: string, currentUserId?: string): Promise<searchResponse[]> {
    return await database.user.findMany({
      where: {
        status: "ACTIVE",
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
        followers: {
          where: { followerId: currentUserId ?? "" },
          select: { id: true },
        },
      },
      take: 10,
      skip: 0,
      orderBy: {
        username: "asc",
      },
    });
  }

  static async getUserByUsername(username: string): Promise<{ id: string } | null> {
    return await database.user.findUnique({
      where: { username },
      select: {
        id: true,
      },
    });
  }

  static async createActivityLog(tx: Prisma.TransactionClient | null, request: CreateUserActivityLogRequest): Promise<void> {
    const db = tx ?? database;
    await db.userActivityLog.create({
      data: {
        userId: request.userId,
        action: request.action,
        metadata: request.metadata,
      },
    });
  }

  static async createFollow(tx: Prisma.TransactionClient | null, userId: string, targetUserId: string): Promise<void> {
    const db = tx ?? database;
    await db.following.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
      },
    });
  }

  static async deleteFollow(userId: string, targetUserId: string): Promise<void> {
    await database.following.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
    });
  }

  static async getFollowings(viewerId: string, targetUserId: string) {
    return await database.following.findMany({
      where: {
        followerId: targetUserId, // people that targetUser follows
      },
      select: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            // Check if viewer (userId) follows this person
            followers: {
              where: { followerId: viewerId },
              select: { id: true },
            },
          },
        },
      },
    });
  }

  static async getFollowers(viewerId: string, targetUserId: string) {
    return await database.following.findMany({
      where: {
        followingId: targetUserId,
      },
      select: {
        follower: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            followers: {
              where: { followerId: viewerId },
              select: { id: true },
            },
          },
        },
      },
    });
  }
}
