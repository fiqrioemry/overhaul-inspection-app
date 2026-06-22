import { Prisma, InspectionRequestAttachmentTypeEnum } from "generated/prisma";
import { pgsql } from "@/lib/database";

const attachmentSelect = {
  id: true,
  fileStorageId: true,
  attachmentUrl: true,
  attachmentType: true,
  caption: true,
  sortOrder: true,
  createdAt: true,
} as const;

export class InspectionRequestAttachmentRepository {
  static async createMany(
    tx: Prisma.TransactionClient | null,
    items: Array<{
      inspectionRequestId: string;
      fileStorageId: string;
      attachmentUrl: string;
      attachmentType?: InspectionRequestAttachmentTypeEnum;
      sortOrder?: number;
      caption?: string;
    }>,
  ) {
    const db = tx ?? pgsql;
    return db.inspectionRequestAttachment.createMany({
      data: items.map((item) => ({
        inspectionRequestId: item.inspectionRequestId,
        fileStorageId: item.fileStorageId,
        attachmentUrl: item.attachmentUrl,
        attachmentType: item.attachmentType ?? "SUPPORTING_DOCUMENT",
        sortOrder: item.sortOrder ?? 0,
        caption: item.caption ?? null,
      })),
    });
  }

  static async findActiveByRequestId(inspectionRequestId: string) {
    return pgsql.inspectionRequestAttachment.findMany({
      where: { inspectionRequestId, deletedAt: null },
      select: attachmentSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  static async findActiveById(id: string, inspectionRequestId: string) {
    return pgsql.inspectionRequestAttachment.findFirst({
      where: { id, inspectionRequestId, deletedAt: null },
      select: { id: true, fileStorageId: true },
    });
  }

  static async countSignedForm(inspectionRequestId: string) {
    return pgsql.inspectionRequestAttachment.count({
      where: { inspectionRequestId, attachmentType: "SIGNED_REQUEST_FORM", deletedAt: null },
    });
  }

  static async softDeleteById(tx: Prisma.TransactionClient | null, id: string, inspectionRequestId: string) {
    const db = tx ?? pgsql;
    return db.inspectionRequestAttachment.updateMany({
      where: { id, inspectionRequestId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
