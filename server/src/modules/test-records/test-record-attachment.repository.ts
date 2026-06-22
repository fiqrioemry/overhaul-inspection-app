import { Prisma } from "generated/prisma";
import { pgsql } from "@/lib/database";

const attachmentSelect = {
  id: true,
  fileStorageId: true,
  attachmentUrl: true,
  caption: true,
  sortOrder: true,
  createdAt: true,
} as const;

export class TestRecordAttachmentRepository {
  static async createMany(
    tx: Prisma.TransactionClient | null,
    items: Array<{ testRecordId: string; fileStorageId: string; attachmentUrl: string; sortOrder?: number; caption?: string }>,
  ) {
    const db = tx ?? pgsql;
    return db.testRecordAttachment.createMany({
      data: items.map((item) => ({
        testRecordId: item.testRecordId,
        fileStorageId: item.fileStorageId,
        attachmentUrl: item.attachmentUrl,
        sortOrder: item.sortOrder ?? 0,
        caption: item.caption ?? null,
      })),
    });
  }

  static async findActiveByTestRecordId(testRecordId: string) {
    return pgsql.testRecordAttachment.findMany({
      where: { testRecordId, deletedAt: null },
      select: attachmentSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  static async findActiveByIds(ids: string[], testRecordId: string) {
    return pgsql.testRecordAttachment.findMany({
      where: { id: { in: ids }, testRecordId, deletedAt: null },
      select: { id: true, fileStorageId: true },
    });
  }

  static async softDeleteByIds(tx: Prisma.TransactionClient | null, ids: string[], testRecordId: string) {
    const db = tx ?? pgsql;
    return db.testRecordAttachment.updateMany({
      where: { id: { in: ids }, testRecordId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
