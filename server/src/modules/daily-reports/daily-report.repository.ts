import { pgsql } from "@/lib/database";
import { Prisma, DailyActivityTypeEnum } from "generated/prisma";

export class DailyReportRepository {
  static async create(data: Prisma.DailyReportCreateInput) {
    return pgsql.dailyReport.create({ data });
  }

  static async findById(id: string) {
    return pgsql.dailyReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: { select: { id: true, tankNo: true, tankName: true } },
        tankProcess: { select: { id: true, name: true, type: true } },
        inspector: { select: { id: true, name: true } },
      },
    });
  }

  static async findMany(query: {
    tankId?: string;
    tankProcessId?: string;
    reportDate?: string;
    activityType?: DailyActivityTypeEnum;
    page: number;
    limit: number;
  }) {
    const { tankId, tankProcessId, reportDate, activityType, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.DailyReportWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(tankProcessId && { tankProcessId }),
      ...(activityType && { activityType }),
      ...(reportDate && { reportDate: new Date(reportDate) }),
    };
    const [reports, total] = await Promise.all([
      pgsql.dailyReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
        include: {
          tank: { select: { id: true, tankNo: true, tankName: true } },
          tankProcess: { select: { id: true, name: true } },
          inspector: { select: { id: true, name: true } },
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
        tank: { select: { id: true, tankNo: true, tankName: true } },
        tankProcess: { select: { id: true, name: true, type: true } },
        inspector: { select: { id: true, name: true } },
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
