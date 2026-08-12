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

  /**
   * Files the cleanup worker may reclaim: marked unused, past the TTL, and no longer
   * reachable from anything live.
   *
   * `isUsed = false` alone is not enough. Removing an attachment soft-deletes the
   * attachment row *and* flags the file unused, but that row still holds a
   * `onDelete: Restrict` foreign key — so a naive delete raises P2003 and, because the
   * previous implementation deleted the storage object first, destroyed the object while
   * the row survived. Every attachment table is therefore checked for a *live* reference
   * (`none: { deletedAt: null }`); soft-deleted references are purged alongside the file
   * in deleteExpiredFile(). Avatars and company logos are excluded outright: their FKs are
   * SetNull, so deleting the file would silently blank a profile instead of erroring.
   */
  static async findExpiredUnusedFiles(): Promise<{ id: string; path: string }[]> {
    return database.fileStorage.findMany({
      where: {
        isUsed: false,
        createdAt: { lt: fileLimit.UNUSED_AVATAR_EXP ? new Date(Date.now() - fileLimit.UNUSED_AVATAR_EXP * 1000) : new Date(Date.now() - 24 * 60 * 60 * 1000) },
        dailyReportAttachments: { none: { deletedAt: null } },
        tankAttachments: { none: { deletedAt: null } },
        inspectionRequestAttachments: { none: { deletedAt: null } },
        testRecordAttachments: { none: { deletedAt: null } },
        avatarOfUser: null,
        logoOfCompany: null,
      },
      select: { id: true, path: true },
    });
  }

  /**
   * Purge one expired file: drop the soft-deleted attachment rows still pinning it, then the
   * file record itself, atomically. Callers must remove the storage object only *after* this
   * resolves — the database is the source of truth, and deleting the object first is what
   * previously left rows pointing at objects that no longer existed.
   *
   * Only rows whose `deletedAt` is set are removed; findExpiredUnusedFiles() has already
   * established that no live reference remains, and the filter here keeps that guarantee
   * local so a mistaken caller cannot detach a live attachment.
   */
  static async deleteExpiredFile(id: string): Promise<void> {
    await database.$transaction(async (tx) => {
      const referencing = { fileStorageId: id, deletedAt: { not: null } } as const;
      await tx.dailyReportAttachment.deleteMany({ where: referencing });
      await tx.tankAttachment.deleteMany({ where: referencing });
      await tx.inspectionRequestAttachment.deleteMany({ where: referencing });
      await tx.testRecordAttachment.deleteMany({ where: referencing });
      await tx.fileStorage.delete({ where: { id } });
    });
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

  static async linkFiles(tx: Prisma.TransactionClient | null, fileIds: string[], targetId: string, module: string): Promise<void> {
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
