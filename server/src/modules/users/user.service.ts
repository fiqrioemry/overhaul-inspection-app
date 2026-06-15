import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { HTTPException } from "hono/http-exception";
import { hashPassword } from "@/utils/hash";
import { generateRandomToken } from "@/utils/generator";
import { hashToken } from "@/utils/hash";
import { sendVerificationLink } from "@/utils/mailer";
import { FileService } from "@/modules/files/file.service";
import { userAction } from "@/config/constant/user.constant";
import { UserRepository } from "@/modules/users/user.repository";
import { FileRepository } from "@/modules/files/file.repository";
import { authLimit } from "@/config/constant/auth.constant";
import { mailConfig, databaseConfig } from "@/config/env";
import { CreateUserRequest, ListUsersQuery, UpdateUserPasswordRequest, UpdateUserRequest, UpdateUserStatusRequest, UpdateProfileRequest } from "@/modules/users/user.schema";

export class UserService {
  static async createUser(request: CreateUserRequest) {
    const existing = await UserRepository.findByEmail(request.email);
    if (existing) {
      throw new HTTPException(409, { message: "Email already exists", cause: "EMAIL_EXISTS" });
    }

    let passwordHash: string | undefined;

    if (request.password) {
      passwordHash = await hashPassword(request.password);
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await UserRepository.create(tx, {
        email: request.email,
        name: request.name,
        role: request.role,
        status: request.isVerified ? "ACTIVE" : "INACTIVE",
        isVerified: request.isVerified,
        passwordHash,
      });

      if (!request.isVerified) {
        const rawToken = generateRandomToken();
        const hashedToken = await hashToken(rawToken);

        await UserRepository.createUserVerification(tx, {
          userId: user.id,
          token: hashedToken,
          type: "EMAIL_VERIFICATION",
          expiresAt: new Date(Date.now() + authLimit.VERIFY_EMAIL_EXP),
        });

        sendVerificationLink({
          to: request.email,
          subject: mailConfig.EMAIL_VERIFICATION_SUBJECT,
          url: `${databaseConfig.CLIENT_URL}/verify-email?token=${rawToken}`,
        });
      }

      await UserRepository.createActivityLog(tx, {
        userId: user.id,
        action: userAction.CREATE_USER,
        metadata: { email: user.email, role: user.role },
      });

      return user;
    });
  }

  static async listUsers(query: ListUsersQuery) {
    const { users, total } = await UserRepository.findMany(query);

    return {
      data: users,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  static async getUserById(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found", cause: "USER_NOT_FOUND" });
    }
    return user;
  }

  static async updateUser(c: Context, id: string, request: UpdateUserRequest, avatarFile?: File) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found", cause: "USER_NOT_FOUND" });
    }

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      let avatarUrl: string | undefined;

      if (avatarFile) {
        const existingFile = await FileService.getFileRecordByTargetId(id, "USER_AVATAR");
        if (existingFile) {
          await FileRepository.markFilesAsUnused(tx, [existingFile.id]);
        }
        const fileDataRecord = await FileService.generateFileRecord(avatarFile, "USER_AVATAR");
        await FileService.uploadFileToStorage(c, fileDataRecord);
        fileDataRecord.isUsed = true;
        await FileService.saveRecordToDatabase(fileDataRecord, tx);
        avatarUrl = fileDataRecord.url!;
      }

      return await UserRepository.update(id, { name: request.name, role: request.role, avatar: avatarUrl });
    });
  }

  static async updateUserStatus(id: string, request: UpdateUserStatusRequest) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found", cause: "USER_NOT_FOUND" });
    }
    return await UserRepository.updateStatus(id, request.status);
  }

  static async updateUserPassword(id: string, request: UpdateUserPasswordRequest) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found", cause: "USER_NOT_FOUND" });
    }
    const hashed = await hashPassword(request.password);
    await UserRepository.updatePassword(id, hashed);
  }

  static async deleteUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new HTTPException(404, { message: "User not found", cause: "USER_NOT_FOUND" });
    }
    await UserRepository.softDelete(id);
  }

  static async updateProfile(c: Context, payload: UpdateProfileRequest) {
    const { userId, ...request } = payload;

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateProfile(userId!, request, tx);
      await UserRepository.createActivityLog(tx, {
        userId: userId!,
        action: userAction.UPDATE_PROFILE,
        metadata: { name: request.name },
      });
    });
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const fileRecord = await FileService.getFileRecordByTargetId(userId, "USER_AVATAR");

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const fileDataRecord = await FileService.generateFileRecord(avatar, "USER_AVATAR");

      if (fileRecord) {
        await FileRepository.markFilesAsUnused(tx, [fileRecord.id]);
      }

      await FileService.uploadFileToStorage(c, fileDataRecord);

      fileDataRecord.isUsed = true;
      const uploadedFile = await FileService.saveRecordToDatabase(fileDataRecord, tx);

      await UserRepository.updateAvatar(userId, fileDataRecord.url!, tx);

      await UserRepository.createActivityLog(tx, {
        userId,
        action: userAction.UPDATE_AVATAR,
        metadata: { fileId: uploadedFile.id, fileUrl: uploadedFile.url },
      });
    });
  }
}
