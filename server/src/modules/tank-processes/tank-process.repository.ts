import { pgsql } from "@/lib/database";
import { Prisma } from "generated/prisma";

export class TankProcessRepository {
  static async findById(id: string) {
    return pgsql.tankProcess.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            projectNo: true,
            type: true,
            status: true,
            tank: { select: { id: true, tankNo: true, tankName: true, hasSteamCoil: true } },
          },
        },
        processTemplate: true,
        _count: { select: { checklistResults: true, findings: true, inspectionRequests: true } },
      },
    });
  }

  static async findByProjectId(projectId: string) {
    return pgsql.tankProcess.findMany({
      where: { projectId },
      orderBy: { sequenceOrder: "asc" },
      include: {
        processTemplate: { select: { code: true, name: true, isOptional: true } },
        _count: { select: { checklistResults: true, findings: true } },
      },
    });
  }

  static async findByProjectAndTemplate(projectId: string, processTemplateId: string) {
    return pgsql.tankProcess.findUnique({
      where: { projectId_processTemplateId: { projectId, processTemplateId } },
    });
  }

  static async updateStatus(id: string, data: Prisma.TankProcessUpdateInput) {
    return pgsql.tankProcess.update({ where: { id }, data });
  }

  static async updateResult(id: string, data: Prisma.TankProcessUpdateInput) {
    return pgsql.tankProcess.update({ where: { id }, data });
  }

  static async getChecklistSummary(tankProcessId: string) {
    return pgsql.checklistResult.findMany({
      where: { tankProcessId },
      include: {
        criteria: { select: { id: true, code: true, name: true, severity: true, isRequired: true } },
      },
      orderBy: [{ criteria: { isRequired: "desc" } }],
    });
  }

  static async getDependencies(processTemplateId: string) {
    return pgsql.processDependency.findMany({
      where: { processTemplateId },
      include: {
        requiredProcessTemplate: { select: { id: true, code: true, name: true } },
      },
    });
  }

  static async findDependantTemplates(requiredProcessTemplateId: string) {
    return pgsql.processDependency.findMany({
      where: { requiredProcessTemplateId },
      select: { processTemplateId: true, requiredStatus: true },
    });
  }
}
