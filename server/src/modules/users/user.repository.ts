import { pgsql as database } from "@/lib/database";
import { Prisma, OAuthProvider, RoleEnum } from "generated/prisma/edge";
import { CreateUserActivityLogRequest, ListUsersQuery, UserOptionsQuery } from "@/modules/users/user.schema";
import { createUserData, verificationType, createVerificationData, updateUserActiveData, UpsertOAuthAccountData, userCredential } from "@/modules/users/user.types";

export class UserRepository {
  static async findByEmail(email: string) {
    return await database.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        avatarFileStorageId: true,
        avatarFile: { select: { url: true } },
        name: true,
        role: true,
        passwordHash: true,
        status: true,
        verifiedAt: true,
        twoFactorEnabled: true,
      },
    });
  }

  static async create(tx: Prisma.TransactionClient | null, user: createUserData) {
    const db = tx ?? database;

    return await db.user.create({
      data: {
        email: user.email,
        passwordHash: user.passwordHash ?? null,
        name: user.name,
        role: user.role,
        status: user.status,
        verifiedAt: user.isVerified ? new Date() : null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatarFileStorageId: true,
        avatarFile: { select: { url: true } },
        verifiedAt: true,
        createdAt: true,
      },
    });
  }

  static async findById(id: string) {
    return await database.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatarFileStorageId: true,
        avatarFile: { select: { url: true } },
        verifiedAt: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
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
        role: true,
        status: true,
        avatarFileStorageId: true,
        avatarFile: { select: { url: true } },
        verifiedAt: true,
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

  static async findMany(query: ListUsersQuery) {
    const { page, limit, search, role, status, orderBy, sortBy } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }],
      }),
      ...(role && { role }),
      ...(status && { status }),
    };

    const [users, total] = await Promise.all([
      database.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          position: true,
          companyId: true,
          company: { select: { id: true, name: true, type: true } },
          avatarFileStorageId: true,
          avatarFile: { select: { url: true } },
          verifiedAt: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [orderBy]: sortBy },
        skip: (page - 1) * limit,
        take: limit,
      }),
      database.user.count({ where }),
    ]);

    return { users, total };
  }

  static async findOptions(query: UserOptionsQuery) {
    const { companyType, role, search } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      status: "ACTIVE",
      ...(role && { role }),
      ...(companyType && { company: { is: { type: companyType, deletedAt: null, isActive: true } } }),
      ...(search && {
        OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }],
      }),
    };

    return database.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        companyId: true,
        company: { select: { id: true, name: true, type: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  static async update(
    id: string,
    data: {
      name?: string;
      role?: RoleEnum;
      avatarFileStorageId?: string | null;
    },
    tx: Prisma.TransactionClient | null = null,
  ) {
    const db = tx ?? database;

    return await db.user.update({
      where: { id, deletedAt: null },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatarFileStorageId: true,
        avatarFile: { select: { url: true } },
        verifiedAt: true,
        updatedAt: true,
      },
    });
  }
  static async updateStatus(id: string, status: string) {
    return await database.user.update({
      where: { id, deletedAt: null },
      data: { status: status as any },
      select: { id: true, status: true },
    });
  }

  static async softDelete(id: string) {
    return await database.user.update({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async updateTwoFactor(userId: string, data: { twoFactorEnabled: boolean; twoFactorSecret?: string | null; twoFactorBackupCodes?: string[] }, tx: Prisma.TransactionClient | null = null) {
    const db = tx ?? database;
    return db.user.update({ where: { id: userId }, data });
  }

  static async createUserVerification(tx: Prisma.TransactionClient | typeof database | null, verificationData: createVerificationData): Promise<void> {
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
      data: { usedAt },
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

  static async getPasswordByUserId(userId: string): Promise<string | null> {
    const result = await database.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    return result?.passwordHash ?? null;
  }

  static async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await database.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash, lastChangePasswordAt: new Date() },
    });
  }

  static async updateAvatar(userId: string, avatarFileStorageId: string, tx: Prisma.TransactionClient | null = null): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: userId },
      data: { avatarFileStorageId: avatarFileStorageId },
    });
  }

  static async updateProfile(userId: string, request: { name?: string }, tx: Prisma.TransactionClient | null = null): Promise<void> {
    const db = tx ?? database;
    await db.user.update({
      where: { id: userId },
      data: { name: request.name },
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

  static async findByOAuthProvider(provider: OAuthProvider, providerAccountId: string) {
    const oauth = await database.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: { provider, providerAccountId },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            avatarFileStorageId: true,
            avatarFile: { select: { url: true } },
            name: true,
            role: true,
            passwordHash: true,
            status: true,
            verifiedAt: true,
          },
        },
      },
    });

    return oauth?.user ?? null;
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
