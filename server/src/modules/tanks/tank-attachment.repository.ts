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

export class TankAttachmentRepository {
  static async createMany(
    tx: Prisma.TransactionClient,
    items: Array<{ tankId: string; fileStorageId: string; attachmentUrl: string; sortOrder?: number; caption?: string }>,
  ) {
    const db = tx ?? pgsql;
    return db.tankAttachment.createMany({
      data: items.map((item) => ({
        tankId: item.tankId,
        fileStorageId: item.fileStorageId,
        attachmentUrl: item.attachmentUrl,
        sortOrder: item.sortOrder ?? 0,
        caption: item.caption ?? null,
      })),
    });
  }

  static async findActiveByTankId(tankId: string) {
    return pgsql.tankAttachment.findMany({
      where: { tankId, deletedAt: null },
      select: attachmentSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }
}
