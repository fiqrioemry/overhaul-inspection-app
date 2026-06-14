import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";

export class TestRecordRepository {
  static async create(data: Prisma.TestRecordCreateInput) {
    return pgsql.testRecord.create({ data });
  }

  static async findById(id: string) {
    return pgsql.testRecord.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: { select: { id: true, tankNo: true, tankName: true } },
            processTemplate: { select: { code: true, name: true } },
          },
        },
        createdByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.testRecord.findMany({
      where: { tankProcessId },
      orderBy: { createdAt: "desc" },
      include: { createdByUser: { select: { id: true, name: true } } },
    });
  }

  static async update(id: string, data: Prisma.TestRecordUpdateInput) {
    return pgsql.testRecord.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return pgsql.testRecord.delete({ where: { id } });
  }
}
