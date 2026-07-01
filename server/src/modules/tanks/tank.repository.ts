import { pgsql } from "@/lib/database";
import { Prisma, TankProjectStatusEnum } from "generated/prisma";

const ACTIVE_PROJECT_STATUSES: TankProjectStatusEnum[] = [
  TankProjectStatusEnum.PLANNED,
  TankProjectStatusEnum.IN_PROGRESS,
  TankProjectStatusEnum.ON_HOLD,
];

export class TankRepository {
  static async create(data: Prisma.TankCreateInput) {
    return pgsql.tank.create({ data });
  }

  static async findById(id: string) {
    return pgsql.tank.findFirst({
      where: { id, deletedAt: null },
      include: {
        createdByUser: { select: { id: true, name: true } },
        shellCourses: { orderBy: { courseNo: "asc" } },
        attachments: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, fileStorageId: true, attachmentUrl: true, caption: true, sortOrder: true, createdAt: true },
        },
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          include: {
            contractorCompany: { select: { id: true, name: true } },
            inspectionCompany: { select: { id: true, name: true } },
            processes: { orderBy: { sequenceOrder: "asc" }, select: { id: true, status: true } },
            _count: { select: { findings: true } },
          },
        },
        _count: { select: { projects: true, findings: true, dailyReports: true } },
      },
    });
  }

  // Finds an ACTIVE tank (deleted_at IS NULL) with the given tank_no. Soft-deleted tanks are
  // ignored so their number can be reused. On update, pass excludeId to skip the tank itself.
  static async findActiveByTankNo(tankNo: string, excludeId?: string) {
    return pgsql.tank.findFirst({
      where: {
        tankNo,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  static async findMany(query: { search?: string; assetStatus?: string; page: number; limit: number }) {
    const { search, assetStatus, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.TankWhereInput = {
      deletedAt: null,
      ...(assetStatus && { assetStatus: assetStatus as any }),
      ...(search && {
        OR: [
          { tankNo: { contains: search, mode: "insensitive" } },
          { tankName: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    const [tanks, total] = await Promise.all([
      pgsql.tank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          projects: {
            where: { deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, projectNo: true, type: true, status: true },
          },
          _count: { select: { projects: true, findings: true } },
        },
      }),
      pgsql.tank.count({ where }),
    ]);
    return { tanks, total };
  }

  static async update(id: string, data: Prisma.TankUpdateInput) {
    return pgsql.tank.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return pgsql.tank.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /** Resolve processes via the tank's most recent active project (legacy /tanks/:id/processes). */
  static async findActiveProjectProcesses(tankId: string) {
    const project = await pgsql.tankProject.findFirst({
      where: { tankId, deletedAt: null, status: { in: ACTIVE_PROJECT_STATUSES } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!project) return { projectId: null, processes: [] };

    const processes = await pgsql.tankProcess.findMany({
      where: { projectId: project.id },
      orderBy: { sequenceOrder: "asc" },
      include: {
        processTemplate: { select: { code: true, isOptional: true, applicabilityRule: true } },
        _count: { select: { checklistResults: true, findings: true } },
      },
    });
    return { projectId: project.id, processes };
  }
}
