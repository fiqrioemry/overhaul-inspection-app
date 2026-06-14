import { pgsql } from "@/lib/database";
import { Prisma, InspectionRequestStatusEnum } from "generated/prisma";

export class InspectionRequestRepository {
  static async create(data: Prisma.InspectionRequestCreateInput) {
    return pgsql.inspectionRequest.create({ data });
  }

  static async findById(id: string) {
    return pgsql.inspectionRequest.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: { select: { id: true, tankNo: true, tankName: true } },
            processTemplate: { select: { code: true, name: true, type: true } },
          },
        },
        requestedByUser: { select: { id: true, name: true, email: true } },
        reviewedByUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.inspectionRequest.findMany({
      where: { tankProcessId },
      orderBy: { createdAt: "desc" },
      include: {
        requestedByUser: { select: { id: true, name: true } },
        reviewedByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async countByTankNo(tankNo: string) {
    return pgsql.inspectionRequest.count({
      where: { requestNo: { startsWith: `REQ-${tankNo}-` } },
    });
  }

  static async findMany(query: {
    tankProcessId?: string;
    tankId?: string;
    status?: InspectionRequestStatusEnum;
    page: number;
    limit: number;
  }) {
    const { tankProcessId, tankId, status, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InspectionRequestWhereInput = {
      ...(tankProcessId && { tankProcessId }),
      ...(status && { status }),
      ...(tankId && { tankProcess: { tankId } }),
    };

    const [requests, total] = await Promise.all([
      pgsql.inspectionRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          tankProcess: {
            include: {
              tank: { select: { id: true, tankNo: true } },
              processTemplate: { select: { code: true, name: true } },
            },
          },
          requestedByUser: { select: { id: true, name: true } },
          reviewedByUser: { select: { id: true, name: true } },
        },
      }),
      pgsql.inspectionRequest.count({ where }),
    ]);

    return { requests, total };
  }

  static async update(id: string, data: Prisma.InspectionRequestUpdateInput) {
    return pgsql.inspectionRequest.update({ where: { id }, data });
  }
}
