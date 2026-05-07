import { prisma } from "@/config/database/prisma";
import { createFileData, fileResponse } from "@/models/file.model";

export class FileRepository {
  static async createFileRecord(data: createFileData): Promise<fileResponse> {
    const result = await prisma.fileStorage.create({
      data: {
        url: data.url,
        targetId: "",
        isUsed: false,
        path: data.path,
        meta: data.metadata,
        module: data.module,
        size: data.size,
        createdBy: data.createdBy,
        expiredAt: data.expiredAt,
      },
      select: {
        id: true,
        url: true,
        path: true,
        createdAt: true,
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
}
