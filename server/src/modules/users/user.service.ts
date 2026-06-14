import { Context } from "hono";
import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";
import { FileService } from "@/modules/files/file.service";
import { userAction } from "@/config/constant/user.constant";
import { UserRepository } from "@/modules/users/user.repository";
import { FileRepository } from "@/modules/files/file.repository";
import { UpdateProfileRequest } from "@/modules/users/user.schema";

export class UserService {
  static async getUsers() {}

  static async updateProfile(c: Context, payload: UpdateProfileRequest) {
    const { userId, ...request } = payload;

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      await UserRepository.updateProfile(userId!, request, tx);
      const userLogs = {
        userId: userId!,
        action: userAction.UPDATE_PROFILE,
        metadata: {
          name: request.name,
          role: request.role,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }

  static async updateAvatar(c: Context, userId: string, avatar: File) {
    const fileRecord = await FileService.getFileRecordByTargetId(userId, "profile");

    return await pgsql.$transaction(async (tx: Prisma.TransactionClient) => {
      const fileDataRecord = await FileService.generateFileRecord(avatar, "profile");

      if (fileRecord) {
        await FileRepository.markFilesAsUnused(tx, [fileRecord.id]);
      }

      await FileService.uploadFileToStorage(c, fileDataRecord);

      fileDataRecord.isUsed = true;
      const uploadedFile = await FileService.saveRecordToDatabase(fileDataRecord, tx);

      await UserRepository.updateAvatar(userId, fileDataRecord.url!, tx);

      const userLogs = {
        userId,
        action: userAction.UPDATE_AVATAR,
        metadata: {
          fileId: uploadedFile.id,
          fileUrl: uploadedFile.url,
        },
      };
      await UserRepository.createActivityLog(tx, userLogs);
    });
  }
}
