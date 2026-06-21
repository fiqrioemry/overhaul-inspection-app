import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";

export class TankRepository {
  static async create(data: Prisma.TankCreateInput) {
    return pgsql.tank.create({ data });
  }

  static async findById(id: string) {
    return pgsql.tank.findFirst({
      where: { id, deletedAt: null },
      include: {
        contractorCompany: { select: { id: true, name: true, type: true } },
        inspectionCompany: { select: { id: true, name: true, type: true } },
        createdByUser: { select: { id: true, name: true } },
        shellCourses: { orderBy: { courseNo: "asc" } },
        attachments: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, fileStorageId: true, attachmentUrl: true, caption: true, sortOrder: true, createdAt: true },
        },
        _count: { select: { processes: true, findings: true } },
      },
    });
  }

  static async findByTankNo(tankNo: string) {
    return pgsql.tank.findFirst({ where: { tankNo, deletedAt: null } });
  }

  static async findMany(query: { search?: string; status?: string; page: number; limit: number }) {
    const { search, status, page, limit } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.TankWhereInput = {
      deletedAt: null,
      ...(status && { status: status as any }),
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
          contractorCompany: { select: { id: true, name: true } },
          inspectionCompany: { select: { id: true, name: true } },
          _count: { select: { processes: true, findings: true } },
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

  static async findWithProcesses(id: string) {
    return pgsql.tank.findFirst({
      where: { id, deletedAt: null },
      include: {
        processes: {
          orderBy: { sequenceOrder: "asc" },
          include: {
            processTemplate: { select: { code: true, isOptional: true, applicabilityRule: true } },
            _count: { select: { checklistResults: true, findings: true } },
          },
        },
      },
    });
  }
}
