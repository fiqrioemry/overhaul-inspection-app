import { pgsql } from "@/lib/database";
import { Prisma, FindingStatusEnum } from "generated/prisma";

export class FindingRepository {
  static async create(data: Prisma.FindingCreateInput) {
    return pgsql.finding.create({ data });
  }

  static async findById(id: string) {
    return pgsql.finding.findFirst({
      where: { id, deletedAt: null },
      include: {
        tank: { select: { id: true, tankNo: true, tankName: true } },
        project: { select: { id: true, projectNo: true, type: true, status: true } },
        tankProcess: { select: { id: true, name: true, type: true, status: true } },
        criteria: { select: { id: true, code: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
        closedByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async findMany(query: { tankId?: string; projectId?: string; tankProcessId?: string; status?: FindingStatusEnum; severity?: string; isBlocking?: boolean; page: number; limit: number }) {
    const { tankId, projectId, tankProcessId, status, severity, isBlocking, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.FindingWhereInput = {
      deletedAt: null,
      ...(tankId && { tankId }),
      ...(projectId && { projectId }),
      ...(tankProcessId && { tankProcessId }),
      ...(status && { status }),
      ...(severity && { severity: severity as any }),
      ...(isBlocking !== undefined && { isBlocking }),
    };
    const [findings, total] = await Promise.all([
      pgsql.finding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tank: { select: { id: true, tankNo: true } },
          project: { select: { id: true, projectNo: true, type: true, status: true } },
          tankProcess: { select: { id: true, name: true } },
          criteria: { select: { id: true, code: true, name: true } },
          createdByUser: { select: { id: true, name: true } },
        },
      }),
      pgsql.finding.count({ where }),
    ]);
    return { findings, total };
  }

  static async update(id: string, data: Prisma.FindingUpdateInput) {
    return pgsql.finding.update({ where: { id }, data });
  }

  static async softDelete(id: string) {
    return pgsql.finding.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  static async countByTankNo(tankNo: string) {
    return pgsql.finding.count({
      where: { findingNo: { startsWith: `FND-${tankNo}-` } },
    });
  }
}
