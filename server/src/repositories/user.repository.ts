import { prisma } from "@/config/database/prisma";
import { CreateUserData, UserCredential, UserResponse } from "@/schema/auth.validation";
import { Prisma, VerificationType } from "generated/prisma/edge";

export class UserRepository {
  static async findByEmail(email: string): Promise<UserCredential | null> {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        username: true,
        passwordHash: true,
        status: true,
        avatar: true,
        lastLogin: true,
        role: true,
        createdAt: true,
      },
    });
  }

  static async create(tx: Prisma.TransactionClient | null, user: CreateUserData): Promise<UserResponse> {
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
      },
    });

    return result;
  }
  static async findById(id: string): Promise<UserResponse | null> {
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
      },
    });
  }

  // create user verification data
  static async createUserVerification(tx: Prisma.TransactionClient | null, verificationData: { userId: string; token: string; type: VerificationType; expiresAt: Date }): Promise<void> {
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

  static async findUserVerification(token: string, type: VerificationType): Promise<{ id: string; userId: string; token: string; expiresAt: Date } | null> {
    return await prisma.userVerification.findFirst({
      where: { token, type, expiresAt: { gt: new Date() }, usedAt: null },
      select: {
        id: true,
        userId: true,
        token: true,
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

  // update user isActive into true

  static async updateUserActive(tx: Prisma.TransactionClient | null, user: { userId: string; status: "ACTIVE" | "INACTIVE" | "BANNED" }): Promise<void> {
    const db = tx ?? prisma;
    await db.user.update({
      where: { id: user.userId },
      data: { status: user.status },
    });
  }
}
