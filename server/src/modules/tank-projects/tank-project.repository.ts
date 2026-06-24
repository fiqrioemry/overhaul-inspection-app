import { pgsql } from "@/lib/database";
import { Prisma, TankProjectStatusEnum } from "generated/prisma";

const ACTIVE_STATUSES: TankProjectStatusEnum[] = [
  TankProjectStatusEnum.PLANNED,
  TankProjectStatusEnum.IN_PROGRESS,
  TankProjectStatusEnum.ON_HOLD,
];

export class TankProjectRepository {
  static async create(data: Prisma.TankProjectUncheckedCreateInput) {
    return pgsql.tankProject.create({ data });
  }

  static async findById(id: string) {
    return pgsql.tankProject.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: { select: { id: true, tankNo: true, tankName: true, location: true, service: true, hasSteamCoil: true } },
        contractorCompany: { select: { id: true, name: true, type: true } },
        inspectionCompany: { select: { id: true, name: true, type: true } },
        createdByUser: { select: { id: true, name: true } },
        _count: { select: { processes: true, findings: true, inspectionRequests: true, dailyReports: true } },
      },
    });
  }

  static async findByProjectNo(projectNo: string) {
    return pgsql.tankProject.findFirst({ where: { projectNo } });
  }

  static async findMany(query: {
    search?: string;
    tankId?: string;
    type?: string;
    status?: string;
    active?: boolean;
    page: number;
    limit: number;
  }) {
    const { search, tankId, type, status, active, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.TankProjectWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(type && { type: type as any }),
      ...(status && { status: status as any }),
      ...(active === true && { status: { in: ACTIVE_STATUSES } }),
      ...(search && {
        OR: [
          { projectNo: { contains: search, mode: "insensitive" } },
          { tank: { tankNo: { contains: search, mode: "insensitive" } } },
          { tank: { tankName: { contains: search, mode: "insensitive" } } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      pgsql.tankProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tank: { select: { id: true, tankNo: true, tankName: true, location: true, service: true } },
          contractorCompany: { select: { id: true, name: true } },
          inspectionCompany: { select: { id: true, name: true } },
          processes: {
            orderBy: { sequenceOrder: "asc" },
            select: { id: true, name: true, status: true, sequenceOrder: true },
          },
          _count: { select: { findings: true } },
        },
      }),
      pgsql.tankProject.count({ where }),
    ]);
    return { projects, total };
  }

  static async findProcesses(projectId: string) {
    return pgsql.tankProcess.findMany({
      where: { projectId },
      orderBy: { sequenceOrder: "asc" },
      include: {
        processTemplate: { select: { code: true, name: true, isOptional: true, applicabilityRule: true } },
        _count: { select: { checklistResults: true, findings: true, inspectionRequests: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.TankProjectUncheckedUpdateInput) {
    return pgsql.tankProject.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return pgsql.tankProject.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  static async countByTankAndPrefix(tankId: string) {
    return pgsql.tankProject.count({ where: { tankId } });
  }
}
