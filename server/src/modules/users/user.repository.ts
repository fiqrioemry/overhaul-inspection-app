import { pgsql as database } from "@/lib/database";
import { Prisma, OAuthProvider } from "generated/prisma/edge";
import { CreateUserActivityLogRequest, UpdateProfileRequest } from "@/modules/users/user.schema";
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
        role: true,
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
        role: true,
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
        role: true,
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

  static async updateTwoFactor(userId: string, data: { twoFactorEnabled: boolean; twoFactorSecret?: string | null; twoFactorBackupCodes?: string[] }, tx: Prisma.TransactionClient | null = null) {
    const db = tx ?? database;
    return db.user.update({ where: { id: userId }, data });
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
        role: request.role,
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

  static async createOAuthUser(tx: Prisma.TransactionClient | null, data: CreateOAuthUserData) {
    const db = tx ?? database;
    return await db.user.create({
      data: {
        email: data.email,
        passwordHash: "",
        name: data.name,
        avatar: data.avatar,
        status: "ACTIVE",
        verifiedAt: new Date(), // email sudah terverifikasi oleh provider
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
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
