import { Prisma } from "generated/prisma/edge";
import { prisma } from "@/config/database/prisma";
import { createFileData, fileResponse } from "@/models/file.model";

export class FileRepository {
  static async createFileRecord(data: createFileData): Promise<fileResponse> {
    const result = await prisma.fileStorage.create({
      data: {
        url: data.url,
        targetId: data.targetId,
        isUsed: data.isUsed ?? false,
        path: data.path,
        meta: data.metadata,
        module: data.module,
        size: data.size,
        createdBy: data.createdBy,
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
    const result = await prisma.fileStorage.findUnique({
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
    await prisma.fileStorage.delete({
      where: { id: fileId },
    });
  }

  static async findExpiredUnusedFiles(): Promise<{ id: string; path: string }[]> {
    return prisma.fileStorage.findMany({
      where: {
        isUsed: false,
        createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true, path: true },
    });
  }

  static async deleteFileRecordsByIds(ids: string[]): Promise<number> {
    const result = await prisma.fileStorage.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  static async getFileRecordsByIds(ids: string[]): Promise<fileResponse[]> {
    const results = await prisma.fileStorage.findMany({
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
    await prisma.fileStorage.updateMany({
      where: { id: { in: ids } },
      data: { isUsed: true },
    });
  }

  static async updateFileTargetIds(
    tx: Prisma.TransactionClient,
    updates: {
      fileId: string;
      targetId: string;
    }[],
  ): Promise<void> {
    const db = tx ?? prisma;

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

  static async getFileRecordByTargetId(targetId: string, module: string): Promise<fileResponse | null> {
    const result = await prisma.fileStorage.findFirst({
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
}
