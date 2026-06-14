import { Prisma } from "generated/prisma/edge";
import { pgsql as database } from "@/lib/database";
import { fileLimit } from "@/config/constant/file.constant";
import { createFileData, fileResponse } from "@/modules/files/file.types";

export class FileRepository {
  static async createFileRecordWithTx(tx: Prisma.TransactionClient, data: createFileData): Promise<fileResponse> {
    const db = tx ?? database;

    const result = await db.fileStorage.create({
      data: {
        url: data.url!,
        targetId: data.targetId!,
        isUsed: data.isUsed ?? false,
        path: data.path!,
        meta: data.metadata!,
        module: data.module!,
        size: data.size!,
        createdBy: data.createdBy!,
      },
      select: {
        id: true,
        url: true,
        path: true,
        createdAt: true,
        module: true,
        isUsed: true,
      },
    });

    return result;
  }

  static async getFileRecordById(fileId: string): Promise<fileResponse | null> {
    const result = await database.fileStorage.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        url: true,
        createdAt: true,
        path: true,
        isUsed: true,
        module: true,
      },
    });

    return result;
  }

  static async deleteFileRecord(fileId: string): Promise<void> {
    await database.fileStorage.delete({
      where: { id: fileId },
    });
  }

  static async findExpiredUnusedFiles(): Promise<{ id: string; path: string }[]> {
    return database.fileStorage.findMany({
      where: {
        isUsed: false,
        createdAt: { lt: fileLimit.UNUSED_AVATAR_EXP ? new Date(Date.now() - fileLimit.UNUSED_AVATAR_EXP * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true, path: true },
    });
  }

  static async deleteFileRecordsByIds(ids: string[]): Promise<number> {
    const result = await database.fileStorage.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  static async markFileRecordsAsUnused(tx: Prisma.TransactionClient, id: string): Promise<void> {
    const db = tx ?? database;
    await db.fileStorage.updateMany({
      where: { id: { in: [id] } },
      data: { isUsed: false },
    });
  }

  static async getFileRecordsByIds(ids: string[]): Promise<fileResponse[]> {
    const results = await database.fileStorage.findMany({
      where: { id: { in: ids }, isUsed: false },
      select: {
        id: true,
        url: true,
        createdAt: true,
        path: true,
        isUsed: true,
        module: true,
      },
    });

    return results;
  }

  static async markFilesAsUsed(ids: string[]): Promise<void> {
    await database.fileStorage.updateMany({
      where: { id: { in: ids } },
      data: { isUsed: true },
    });
  }

  static async markFilesAsUnused(tx: Prisma.TransactionClient, ids: string[]): Promise<void> {
    const db = tx ?? database;
    await db.fileStorage.updateMany({
      where: { id: { in: ids } },
      data: { isUsed: false },
    });
  }

  static async updateFileTargetIds(
    tx: Prisma.TransactionClient,
    updates: {
      fileId: string;
      targetId: string;
    }[],
  ): Promise<void> {
    const db = tx ?? database;

    // update satu per satu karena setiap file memiliki targetId berbeda
    await Promise.all(
      updates.map((item) =>
        db.fileStorage.update({
          where: {
            id: item.fileId,
          },
          data: {
            targetId: item.targetId,
            isUsed: true,
          },
        }),
      ),
    );
  }

  static async linkFiles(
    tx: Prisma.TransactionClient | null,
    fileIds: string[],
    targetId: string,
    module: string,
  ): Promise<void> {
    if (!fileIds || fileIds.length === 0) return;
    const db = tx ?? database;
    await db.fileStorage.updateMany({
      where: { id: { in: fileIds } },
      data: { isUsed: true, targetId, module },
    });
  }

  static async getFileRecordsByTargetId(targetId: string, module: string): Promise<fileResponse[]> {
    return database.fileStorage.findMany({
      where: { targetId, module, isUsed: true },
      select: { id: true, url: true, createdAt: true, path: true, isUsed: true, module: true },
    });
  }

  static async getFileRecordByTargetId(targetId: string, module: string): Promise<fileResponse | null> {
    const result = await database.fileStorage.findFirst({
      where: { targetId, module },
      select: {
        id: true,
        url: true,
        createdAt: true,
        path: true,
        isUsed: true,
        module: true,
      },
    });

    return result;
  }

  static async createMultipleFileRecordWithTx(tx: Prisma.TransactionClient, data: createFileData[]): Promise<fileResponse[]> {
    const db = tx ?? database;

    await db.fileStorage.createMany({
      data: data.map((item) => ({
        url: item.url!,
        targetId: item.targetId!,
        isUsed: item.isUsed ?? false,
        path: item.path!,
        meta: item.metadata!,
        module: item.module!,
        size: item.size!,
        createdBy: item.createdBy,
      })),
    });

    const urls = data.map((item) => item.url!);
    const results = await db.fileStorage.findMany({
      where: {
        url: { in: urls },
      },
      select: {
        id: true,
        url: true,
        path: true,
        createdAt: true,
        module: true,
        isUsed: true,
      },
    });

    return results;
  }
}
