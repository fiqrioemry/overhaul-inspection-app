import { Prisma, OAuthProvider } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";
import { CreateUserActivityLogRequest, GetFollowRequest, UpdateProfileRequest } from "@/modules/users/user.schema";
import { createUserData, verificationType, createVerificationData, updateUserActiveData, UpsertOAuthAccountData, CreateOAuthUserData, userCredential } from "@/modules/users/user.types";

export class UserRepository {
  static async findByEmail(email: string) {
    return await database.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        avatar: true,
        name: true,
        username: true,
        passwordHash: true,
        status: true,
        verifiedAt: true,
      },
    });
  }

  static async create(tx: Prisma.TransactionClient | null, user: createUserData) {
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
        lastChangePasswordAt: true,
      },
    });

    return result;
  }

  static async findById(id: string) {
    return await database.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
        lastChangePasswordAt: true,
      },
    });
  }

  static async getProfileByUsername(username: string, currentUserId?: string) {
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

  static async findUserVerification(token: string, type: verificationType) {
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
      data: { passwordHash: newPasswordHash, lastChangePasswordAt: new Date() },
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
      data: { name: request.name, bio: request.bio, gender: request.gender },
    });
  }

  static async searchUsersByUsername(username: string, currentUserId?: string) {
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

  static async getFollowings(query: GetFollowRequest) {
    const {
      userId, // current logged-in user
      targetUserId, // profile being viewed
      search,
      page = 1,
      limit = 10,
    } = query;

    const where = {
      followerId: targetUserId, // users that targetUser follows
      following: {
        deletedAt: null,
        status: "ACTIVE" as const,
        ...(search?.trim()
          ? {
              OR: [
                {
                  username: {
                    contains: search.trim(),
                    mode: "insensitive" as const,
                  },
                },
                {
                  name: {
                    contains: search.trim(),
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
    };

    const [results, totalItems] = await Promise.all([
      database.following.findMany({
        where,
        select: {
          following: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,

              // cek apakah current user sudah follow user ini
              followers: {
                where: {
                  followerId: userId,
                },
                select: {
                  id: true,
                },
              },

              _count: {
                select: {
                  followers: true,
                  following: true,
                  posts: true,
                },
              },
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      database.following.count({
        where,
      }),
    ]);

    return {
      results: results.map((item) => ({
        ...item.following,
        isFollowing: item.following.followers.length > 0,
      })),
      totalItems,
    };
  }

  static async getFollowers(query: GetFollowRequest) {
    const { userId, targetUserId, search, page = 1, limit = 10 } = query;

    const where = {
      followingId: targetUserId,
      follower: {
        deletedAt: null,
        status: "ACTIVE" as const,
        ...(search?.trim()
          ? {
              OR: [
                {
                  username: {
                    contains: search.trim(),
                    mode: "insensitive" as const,
                  },
                },
                {
                  name: {
                    contains: search.trim(),
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
    };

    const [results, totalItems] = await Promise.all([
      database.following.findMany({
        where,
        select: {
          follower: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,

              followers: {
                where: {
                  followerId: userId,
                },
                select: {
                  id: true,
                },
              },

              _count: {
                select: {
                  followers: true,
                  following: true,
                  posts: true,
                },
              },
            },
          },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          createdAt: "desc",
        },
      }),
      database.following.count({
        where,
      }),
    ]);

    return {
      results: results.map((item) => ({
        ...item.follower,
        isFollowing: item.follower.followers.length > 0,
      })),
      totalItems,
    };
  }

  static async updatePrivacy(userId: string, isPublic: boolean): Promise<void> {
    await database.user.update({
      where: { id: userId },
      data: { isPublic },
    });
  }

  static async findByOAuthProvider(provider: OAuthProvider, providerAccountId: string): Promise<userCredential | null> {
    const oauth = await database.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
            name: true,
            username: true,
            passwordHash: true,
            status: true,
            verifiedAt: true,
          },
        },
      },
    });

    return oauth?.user ?? null;
  }

  static async createOAuthUser(tx: Prisma.TransactionClient | null, data: CreateOAuthUserData) {
    const db = tx ?? database;
    return await db.user.create({
      data: {
        email: data.email,
        passwordHash: "",
        name: data.name,
        username: data.username,
        avatar: data.avatar,
        status: "ACTIVE",
        verifiedAt: new Date(), // email sudah terverifikasi oleh provider
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
        lastChangePasswordAt: true,
      },
    });
  }

  static async upsertOAuthAccount(tx: Prisma.TransactionClient | null, data: UpsertOAuthAccountData): Promise<void> {
    const db = tx ?? database;
    await db.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      },
      create: {
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
      },
    });
  }
}
