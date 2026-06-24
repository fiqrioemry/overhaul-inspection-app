import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";

const attachmentSelect = {
  id: true,
  fileStorageId: true,
  attachmentUrl: true,
  caption: true,
  sortOrder: true,
  createdAt: true,
} as const;

const baseInclude = {
  inspectionRequest: { select: { id: true, requestNo: true, testType: true, status: true } },
  inspectionRequestItem: { select: { id: true, objectType: true, objectName: true } },
  tankProcess: {
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      projectId: true,
      project: {
        select: {
          id: true,
          projectNo: true,
          tank: { select: { id: true, tankNo: true, tankName: true } },
        },
      },
    },
  },
  createdByUser: { select: { id: true, name: true } },
  attachments: {
    where: { deletedAt: null },
    select: attachmentSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
} satisfies Prisma.TestRecordInclude;

export class TestRecordRepository {
  static async create(data: Prisma.TestRecordCreateInput) {
    return pgsql.testRecord.create({ data });
  }

  static async findById(id: string) {
    return pgsql.testRecord.findUnique({ where: { id }, include: baseInclude });
  }

  static async findByRequest(inspectionRequestId: string) {
    return pgsql.testRecord.findMany({
      where: { inspectionRequestId },
      orderBy: { createdAt: "asc" },
      include: baseInclude,
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.testRecord.findMany({
      where: { tankProcessId },
      orderBy: { createdAt: "desc" },
      include: baseInclude,
    });
  }

  static async update(id: string, data: Prisma.TestRecordUpdateInput) {
    return pgsql.testRecord.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return pgsql.testRecord.delete({ where: { id } });
  }
}
