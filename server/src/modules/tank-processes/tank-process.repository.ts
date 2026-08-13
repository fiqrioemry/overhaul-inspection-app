import { pgsql } from "@/lib/database";
import { Prisma, ProcessStatusEnum } from "generated/prisma";

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

  // Ownership lookup for the tank-scoped routes: carries the owning project's tankId and both
  // soft-delete markers so the service can tell "no such process" apart from "belongs to another
  // tank" and from "its tank/project is soft-deleted" without a second round trip.
  static async findByIdWithOwner(id: string) {
    return pgsql.tankProcess.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        status: true,
        startDate: true,
        finishDate: true,
        project: {
          select: {
            id: true,
            tankId: true,
            status: true,
            deletedAt: true,
            tank: { select: { id: true, deletedAt: true } },
          },
        },
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

  // Conditional (compare-and-set) status write: the WHERE carries the expected status, so a row
  // another request already moved on simply matches nothing and reports count 0 instead of being
  // overwritten. Returns the number of rows written.
  static async updateStatusIfCurrent(
    tx: Prisma.TransactionClient,
    id: string,
    expectedStatus: ProcessStatusEnum,
    data: Prisma.TankProcessUncheckedUpdateManyInput,
  ) {
    const result = await tx.tankProcess.updateMany({ where: { id, status: expectedStatus }, data });
    return result.count;
  }

  static async updateResult(id: string, data: Prisma.TankProcessUpdateInput) {
    return pgsql.tankProcess.update({ where: { id }, data });
  }

  static async updateDates(id: string, data: Pick<Prisma.TankProcessUncheckedUpdateInput, "startDate" | "finishDate">) {
    return pgsql.tankProcess.update({ where: { id }, data });
  }

  // Hard delete — TankProcess has no deletedAt column. ChecklistResult cascades;
  // Finding/InspectionRequest/TestRecord/DailyReport only SetNull their tankProcessId,
  // so the service must guard against removing a process those already reference.
  static async delete(id: string) {
    return pgsql.tankProcess.delete({ where: { id } });
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
