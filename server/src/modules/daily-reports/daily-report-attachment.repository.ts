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

export class DailyReportAttachmentRepository {
  static async createMany(
    tx: Prisma.TransactionClient,
    items: Array<{ dailyReportId: string; fileStorageId: string; attachmentUrl: string; sortOrder?: number; caption?: string }>,
  ) {
    const db = tx ?? pgsql;
    return db.dailyReportAttachment.createMany({
      data: items.map((item) => ({
        dailyReportId: item.dailyReportId,
        fileStorageId: item.fileStorageId,
        attachmentUrl: item.attachmentUrl,
        sortOrder: item.sortOrder ?? 0,
        caption: item.caption ?? null,
      })),
    });
  }

  static async findActiveByDailyReportId(dailyReportId: string) {
    return pgsql.dailyReportAttachment.findMany({
      where: { dailyReportId, deletedAt: null },
      select: attachmentSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  static async findActiveByIds(ids: string[], dailyReportId: string) {
    return pgsql.dailyReportAttachment.findMany({
      where: { id: { in: ids }, dailyReportId, deletedAt: null },
      select: { id: true, fileStorageId: true },
    });
  }

  static async countActive(dailyReportId: string) {
    return pgsql.dailyReportAttachment.count({
      where: { dailyReportId, deletedAt: null },
    });
  }

  static async softDeleteByIds(tx: Prisma.TransactionClient, ids: string[], dailyReportId: string) {
    const db = tx ?? pgsql;
    return db.dailyReportAttachment.updateMany({
      where: { id: { in: ids }, dailyReportId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  static async updateCaptions(
    tx: Prisma.TransactionClient,
    updates: Array<{ attachmentId: string; caption: string }>,
    dailyReportId: string,
  ) {
    const db = tx ?? pgsql;
    return Promise.all(
      updates.map((u) =>
        db.dailyReportAttachment.updateMany({
          where: { id: u.attachmentId, dailyReportId, deletedAt: null },
          data: { caption: u.caption },
        }),
      ),
    );
  }
}
