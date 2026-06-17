import { pgsql } from "@/lib/database";
import { Prisma, DailyActivityTypeEnum } from "generated/prisma";

const attachmentSelect = {
  id: true,
  fileStorageId: true,
  attachmentUrl: true,
  caption: true,
  sortOrder: true,
  createdAt: true,
} as const;

const tankSelect = {
  id: true,
  tankNo: true,
  tankName: true,
  location: true,
  inspectionCompany: { select: { id: true, name: true } },
} as const;

export class DailyReportRepository {
  static async findById(id: string) {
    return pgsql.dailyReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: { select: tankSelect },
        tankProcess: { select: { id: true, name: true, type: true } },
        inspector: { select: { id: true, name: true } },
        attachments: {
          where: { deletedAt: null },
          select: attachmentSelect,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  }

  static async findMany(query: {
    tankId?: string;
    tankProcessId?: string;
    reportDate?: string;
    startDate?: string;
    endDate?: string;
    activityType?: DailyActivityTypeEnum;
    page: number;
    limit: number;
  }) {
    const { tankId, tankProcessId, reportDate, startDate, endDate, activityType, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.DailyReportWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(tankProcessId && { tankProcessId }),
      ...(activityType && { activityType }),
      ...(reportDate && { reportDate: new Date(reportDate) }),
      ...((startDate || endDate) && {
        reportDate: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate && { lte: new Date(endDate) }),
        },
      }),
    };
    const [reports, total] = await Promise.all([
      pgsql.dailyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
        include: {
          tank: { select: tankSelect },
          tankProcess: { select: { id: true, name: true } },
          inspector: { select: { id: true, name: true } },
          attachments: {
            where: { deletedAt: null },
            select: attachmentSelect,
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      }),
      pgsql.dailyReport.count({ where }),
    ]);
    return { reports, total };
  }

  static async findByTankAndDate(tankId: string, date: string) {
    return pgsql.dailyReport.findMany({
      where: { tankId, reportDate: new Date(date), deletedAt: null },
      include: {
        tank: { select: tankSelect },
        tankProcess: { select: { id: true, name: true, type: true } },
        inspector: { select: { id: true, name: true } },
        attachments: {
          where: { deletedAt: null },
          select: attachmentSelect,
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static async update(id: string, data: Prisma.DailyReportUpdateInput) {
    return pgsql.dailyReport.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return pgsql.dailyReport.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
