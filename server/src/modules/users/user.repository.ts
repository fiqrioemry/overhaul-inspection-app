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
        twoFactorEnabled: true,
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

  static async findByIdWithTwoFactor(id: string) {
    return database.user.findUnique({
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
        passwordHash: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      },
    });
  }

  static async updateTwoFactor(
    userId: string,
    data: { twoFactorEnabled: boolean; twoFactorSecret?: string | null; twoFactorBackupCodes?: string[] },
    tx: Prisma.TransactionClient | null = null,
  ) {
    const db = tx ?? database;
    return db.user.update({ where: { id: userId }, data });
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
        website: true,
        lastLogin: true,
        createdAt: true,
        followers: {
          where: {
            followerId: currentUserId ?? "",
            status: "ACCEPTED",
          },
          select: { id: true },
        },
        _count: {
          select: {
            followers: {
              where: { status: "ACCEPTED" },
            },
            following: {
              where: { status: "ACCEPTED" },
            },
            posts: {
              where: { deletedAt: null },
            },
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
      select: { passwordHash: true },
    });
    // Use ?? so empty string (OAuth accounts with no password) is preserved, not coerced to null
    return result?.passwordHash ?? null;
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
      data: {
        name: request.name,
        bio: request.bio,
        gender: request.gender,
        website: request.website === "" ? null : request.website,
        ...(request.username ? { username: request.username } : {}),
      },
    });
  }

  static async searchUsersByUsername(username: string, currentUserId?: string) {
    return await database.user.findMany({
      where: {
        status: "ACTIVE",
        username: { contains: username, mode: "insensitive" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatar: true,
        followers: {
          where: {
            followerId: currentUserId ?? "",
            status: "ACCEPTED",
          },
          select: { id: true },
        },
      },
      take: 10,
      skip: 0,
      orderBy: { username: "asc" },
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
    const { userId, targetUserId, search, page = 1, limit = 10 } = query;

    const where = {
      followerId: targetUserId,
      status: "ACCEPTED" as const, // ← tambah ini
      following: {
        deletedAt: null,
        status: "ACTIVE" as const,
        ...(search?.trim()
          ? {
              OR: [{ username: { contains: search.trim(), mode: "insensitive" as const } }, { name: { contains: search.trim(), mode: "insensitive" as const } }],
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

              followers: {
                where: {
                  followerId: userId,
                  status: "ACCEPTED",
                },
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
      status: "ACCEPTED" as const, // ← tambah ini
      follower: {
        deletedAt: null,
        status: "ACTIVE" as const,
        ...(search?.trim()
          ? {
              OR: [{ username: { contains: search.trim(), mode: "insensitive" as const } }, { name: { contains: search.trim(), mode: "insensitive" as const } }],
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
                  status: "ACCEPTED",
                },
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

  static async createFollow(tx: Prisma.TransactionClient | null, userId: string, targetUserId: string, status: "PENDING" | "ACCEPTED"): Promise<void> {
    const db = tx ?? database;
    await db.following.create({
      data: {
        followerId: userId,
        followingId: targetUserId,
        status,
        acceptedAt: status === "ACCEPTED" ? new Date() : null,
      },
    });
  }

  // Find the follow record between two users (any status)
  static async findFollow(followerId: string, followingId: string) {
    return await database.following.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true, status: true },
    });
  }

  static async acceptFollow(tx: Prisma.TransactionClient | null, followerId: string, followingId: string): Promise<void> {
    const db = tx ?? database;
    await db.following.update({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });
  }

  // Get incoming PENDING requests for a user (they are the followingId)
  static async getPendingFollowRequests(followingId: string, page: number, limit: number) {
    const where = { followingId, status: "PENDING" as const };

    const [results, totalItems] = await Promise.all([
      database.following.findMany({
        where,
        select: {
          id: true,
          createdAt: true,
          follower: {
            select: { id: true, name: true, username: true, avatar: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.following.count({ where }),
    ]);

    return { results, totalItems };
  }

  static async isPublicAccount(userId: string): Promise<boolean> {
    const result = await database.user.findUnique({
      where: { id: userId },
      select: { isPublic: true },
    });
    return result?.isPublic ?? true;
  }

  // ── Block ──────────────────────────────────────────────────────────────────

  static async findBlock(blockerId: string, blockedId: string) {
    return database.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      select: { id: true },
    });
  }

  static async createBlock(tx: Prisma.TransactionClient, blockerId: string, blockedId: string) {
    return tx.userBlock.create({
      data: { blockerId, blockedId },
      select: { id: true, blockedId: true, createdAt: true },
    });
  }

  static async deleteBlock(blockerId: string, blockedId: string) {
    return database.userBlock.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
  }

  static async getBlockedUsers(blockerId: string, page: number, limit: number) {
    const where = { blockerId };
    const [results, totalItems] = await Promise.all([
      database.userBlock.findMany({
        where,
        select: {
          id: true,
          blockedId: true,
          createdAt: true,
          blocked: { select: { id: true, name: true, username: true, avatar: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.userBlock.count({ where }),
    ]);
    return { results, totalItems };
  }

  // ── Mute ──────────────────────────────────────────────────────────────────

  static async findMute(muterId: string, mutedId: string) {
    return database.userMute.findUnique({
      where: { muterId_mutedId: { muterId, mutedId } },
      select: { id: true },
    });
  }

  static async createMute(tx: Prisma.TransactionClient, muterId: string, mutedId: string, muteType: string) {
    return tx.userMute.create({
      data: { muterId, mutedId, muteType },
      select: { id: true, mutedId: true, muteType: true, createdAt: true },
    });
  }

  static async deleteMute(muterId: string, mutedId: string) {
    return database.userMute.delete({
      where: { muterId_mutedId: { muterId, mutedId } },
    });
  }

  static async getMutedUsers(muterId: string, page: number, limit: number) {
    const where = { muterId };
    const [results, totalItems] = await Promise.all([
      database.userMute.findMany({
        where,
        select: {
          id: true,
          mutedId: true,
          muteType: true,
          createdAt: true,
          muted: { select: { id: true, name: true, username: true, avatar: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      database.userMute.count({ where }),
    ]);
    return { results, totalItems };
  }

  static async getMutedUserIds(muterId: string): Promise<string[]> {
    const mutes = await database.userMute.findMany({
      where: { muterId },
      select: { mutedId: true },
    });
    return mutes.map((m) => m.mutedId);
  }

  static async getBlockedAndBlockingIds(userId: string): Promise<string[]> {
    const [blocked, blocking] = await Promise.all([
      database.userBlock.findMany({ where: { blockerId: userId }, select: { blockedId: true } }),
      database.userBlock.findMany({ where: { blockedId: userId }, select: { blockerId: true } }),
    ]);
    return [...blocked.map((b) => b.blockedId), ...blocking.map((b) => b.blockerId)];
  }

  // ── Profile ───────────────────────────────────────────────────────────────

  static async updateWebsite(userId: string, website: string | null, tx: Prisma.TransactionClient | null = null) {
    const db = tx ?? database;
    return db.user.update({ where: { id: userId }, data: { website } });
  }
}
