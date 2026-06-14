import { pgsql } from "@/lib/database";
import { Prisma, RadiographyJointResultEnum } from "generated/prisma";

export class RadiographyRepository {
  static async create(data: Prisma.RadiographyTestCreateInput) {
    return pgsql.radiographyTest.create({ data });
  }

  static async findById(id: string) {
    return pgsql.radiographyTest.findUnique({
      where: { id },
      include: {
        tankProcess: {
          include: {
            tank: { select: { id: true, tankNo: true, tankName: true } },
            processTemplate: { select: { code: true, name: true } },
          },
        },
        createdByUser: { select: { id: true, name: true } },
        jointResults: { orderBy: { jointNo: "asc" } },
      },
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.radiographyTest.findMany({
      where: { tankProcessId },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: { select: { id: true, name: true } },
        _count: { select: { jointResults: true } },
      },
    });
  }

  static async update(id: string, data: Prisma.RadiographyTestUpdateInput) {
    return pgsql.radiographyTest.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return pgsql.radiographyTest.delete({ where: { id } });
  }

  static async createJoint(data: Prisma.RadiographyJointResultCreateInput) {
    return pgsql.radiographyJointResult.create({ data });
  }

  static async findJointById(id: string) {
    return pgsql.radiographyJointResult.findUnique({
      where: { id },
      include: { radiographyTest: { select: { id: true, tankProcessId: true } } },
    });
  }

  static async updateJoint(id: string, data: Prisma.RadiographyJointResultUpdateInput) {
    return pgsql.radiographyJointResult.update({ where: { id }, data });
  }

  static async deleteJoint(id: string) {
    return pgsql.radiographyJointResult.delete({ where: { id } });
  }

  static async recalculateTotals(radiographyTestId: string) {
    const joints = await pgsql.radiographyJointResult.findMany({
      where: { radiographyTestId },
    });

    const totalJoint = joints.length;
    const totalShot = joints.length;
    const totalAccepted = joints.filter((j) => j.result === RadiographyJointResultEnum.ACCEPTED).length;
    const totalRepair = joints.filter((j) => j.result === RadiographyJointResultEnum.REPAIR).length;
    const totalReshoot = joints.filter((j) => j.result === RadiographyJointResultEnum.RESHOOT).length;

    const hasRepairOrReshoot = totalRepair > 0 || totalReshoot > 0;
    const allAccepted = totalJoint > 0 && totalAccepted === totalJoint;
    const result = allAccepted ? "PASSED" : hasRepairOrReshoot ? "PENDING" : totalJoint === 0 ? "PENDING" : "PENDING";

    return pgsql.radiographyTest.update({
      where: { id: radiographyTestId },
      data: { totalJoint, totalShot, totalAccepted, totalRepair, totalReshoot, result: result as any },
    });
  }
}
