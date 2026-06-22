import { pgsql } from "@/lib/database";
import { Prisma, InspectionRequestStatusEnum, InspectionRequestTypeEnum } from "generated/prisma";

const itemSelect = {
  id: true,
  objectType: true,
  objectName: true,
  quantity: true,
  unit: true,
  locationDetail: true,
  remarks: true,
  sortOrder: true,
  metadata: true,
} as const;

const attachmentSelect = {
  id: true,
  fileStorageId: true,
  attachmentUrl: true,
  attachmentType: true,
  caption: true,
  sortOrder: true,
  createdAt: true,
} as const;

const tankSelect = {
  id: true,
  tankNo: true,
  tankName: true,
  location: true,
  inspectionCompany: { select: { id: true, name: true, logoFile: { select: { url: true } } } },
  contractorCompany: { select: { id: true, name: true, logoFile: { select: { url: true } } } },
} as const;

const detailInclude = {
  tank: { select: tankSelect },
  tankProcess: { select: { id: true, name: true, type: true } },
  requestedByUser: { select: { id: true, name: true, email: true } },
  items: { select: itemSelect, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
  attachments: {
    where: { deletedAt: null },
    select: attachmentSelect,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  },
  testRecords: {
    select: { id: true, status: true, result: true, inspectionRequestItemId: true },
  },
} satisfies Prisma.InspectionRequestInclude;

export class InspectionRequestRepository {
  static async findById(id: string) {
    return pgsql.inspectionRequest.findFirst({
      where: { id, deletedAt: null },
      include: detailInclude,
    });
  }

  static async findMany(query: {
    tankId?: string;
    tankProcessId?: string;
    testType?: InspectionRequestTypeEnum;
    status?: InspectionRequestStatusEnum;
    page: number;
    limit: number;
  }) {
    const { tankId, tankProcessId, testType, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InspectionRequestWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(tankProcessId && { tankProcessId }),
      ...(testType && { testType }),
      ...(status && { status }),
    };

    const [requests, total] = await Promise.all([
      pgsql.inspectionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tank: { select: { id: true, tankNo: true, tankName: true } },
          tankProcess: { select: { id: true, name: true } },
          requestedByUser: { select: { id: true, name: true } },
          items: { select: { id: true } },
          testRecords: { select: { id: true, status: true } },
        },
      }),
      pgsql.inspectionRequest.count({ where }),
    ]);

    return { requests, total };
  }

  static async countForRequestNo(prefix: string) {
    return pgsql.inspectionRequest.count({
      where: { requestNo: { startsWith: prefix } },
    });
  }

  static async createWithItems(
    tx: Prisma.TransactionClient,
    data: Prisma.InspectionRequestCreateInput,
    items: Array<Prisma.InspectionRequestItemCreateManyInspectionRequestInput>,
  ) {
    const created = await tx.inspectionRequest.create({ data });
    if (items.length > 0) {
      await tx.inspectionRequestItem.createMany({
        data: items.map((item, idx) => ({ ...item, inspectionRequestId: created.id, sortOrder: item.sortOrder ?? idx })),
      });
    }
    return created;
  }

  static async replaceItems(
    tx: Prisma.TransactionClient,
    inspectionRequestId: string,
    items: Array<Prisma.InspectionRequestItemCreateManyInspectionRequestInput>,
  ) {
    await tx.inspectionRequestItem.deleteMany({ where: { inspectionRequestId } });
    if (items.length > 0) {
      await tx.inspectionRequestItem.createMany({
        data: items.map((item, idx) => ({ ...item, inspectionRequestId, sortOrder: item.sortOrder ?? idx })),
      });
    }
  }

  static async update(id: string, data: Prisma.InspectionRequestUpdateInput) {
    return pgsql.inspectionRequest.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return pgsql.inspectionRequest.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  static async findTankOptions() {
    return pgsql.tank.findMany({
      where: { deletedAt: null },
      select: { id: true, tankNo: true, tankName: true },
      orderBy: { tankNo: "asc" },
    });
  }

  static async findTankProcessOptions(tankId: string) {
    return pgsql.tankProcess.findMany({
      where: { tankId },
      select: { id: true, name: true, type: true, status: true },
      orderBy: { sequenceOrder: "asc" },
    });
  }
}
