import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";

export class ChecklistResultRepository {
  static async findById(id: string) {
    return pgsql.checklistResult.findUnique({
      where: { id },
      include: {
        criteria: true,
        tankProcess: { select: { id: true, tankId: true, status: true } },
        checkedByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.checklistResult.findMany({
      where: { tankProcessId },
      include: {
        criteria: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            acceptanceType: true,
            operator: true,
            minValue: true,
            maxValue: true,
            unit: true,
            acceptanceText: true,
            severity: true,
            isRequired: true,
          },
        },
        checkedByUser: { select: { id: true, name: true } },
      },
      orderBy: [{ criteria: { isRequired: "desc" } }, { criteria: { code: "asc" } }],
    });
  }

  static async update(id: string, data: Prisma.ChecklistResultUpdateInput) {
    return pgsql.checklistResult.update({ where: { id }, data });
  }
}
