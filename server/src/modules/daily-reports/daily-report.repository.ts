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
} as const;

// Contractor / inspection companies are project-level now; expose them via the linked project.
const projectSelect = {
  id: true,
  projectNo: true,
  type: true,
  status: true,
  inspectionCompany: { select: { id: true, name: true, logoFile: { select: { url: true } } } },
  contractorCompany: { select: { id: true, name: true, logoFile: { select: { url: true } } } },
} as const;

export class DailyReportRepository {
  static async findById(id: string) {
    return pgsql.dailyReport.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: { select: tankSelect },
        project: { select: projectSelect },
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
    projectId?: string;
    tankProcessId?: string;
    reportDate?: string;
    startDate?: string;
    endDate?: string;
    activityType?: DailyActivityTypeEnum;
    page: number;
    limit: number;
  }) {
    const { tankId, projectId, tankProcessId, reportDate, startDate, endDate, activityType, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.DailyReportWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(projectId && { projectId }),
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
          project: { select: projectSelect },
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
        project: { select: projectSelect },
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

  static async findTankOptions() {
    return pgsql.tank.findMany({
      where: { deletedAt: null },
      select: { id: true, tankNo: true, tankName: true },
      orderBy: { tankNo: "asc" },
    });
  }

  static async findTankProcessOptions(tankId: string) {
    return pgsql.tankProcess.findMany({
      where: { project: { tankId, deletedAt: null } },
      select: { id: true, name: true, type: true, status: true, projectId: true },
      orderBy: [{ project: { createdAt: "desc" } }, { sequenceOrder: "asc" }],
    });
  }

  static async findProjectOptions(tankId: string) {
    return pgsql.tankProject.findMany({
      where: { tankId, deletedAt: null },
      select: { id: true, projectNo: true, type: true, status: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
