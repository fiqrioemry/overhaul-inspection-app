import { pgsql } from "@/lib/database";
import { ChecklistStatusEnum, ChecklistSourceEnum } from "generated/prisma";
import type { AddCustomChecklistRequest } from "./checklist-result.schema";

const criteriaWithRefsSelect = {
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
  method: true,
  tools: true,
  severity: true,
  isRequired: true,
  criteriaRefs: {
    select: {
      clause: true,
      page: true,
      notes: true,
      referenceDocument: { select: { code: true, title: true } },
    },
  },
} as const;

const checklistSelect = {
  id: true,
  tankProcessId: true,
  criteriaId: true,
  source: true,
  status: true,
  isRequired: true,
  sequenceOrder: true,
  customName: true,
  customDescription: true,
  customAcceptanceText: true,
  customMethod: true,
  customReferenceText: true,
  remarks: true,
  checkedAt: true,
  createdAt: true,
  updatedAt: true,
  checkedByUser: { select: { id: true, name: true } },
  criteria: { select: criteriaWithRefsSelect },
} as const;

export class ChecklistResultRepository {
  static async findById(id: string) {
    return pgsql.checklistResult.findUnique({
      where: { id },
      select: {
        ...checklistSelect,
        tankProcess: { select: { id: true, tankId: true, status: true } },
      },
    });
  }

  static async findByTankProcess(tankProcessId: string) {
    return pgsql.checklistResult.findMany({
      where: { tankProcessId },
      select: checklistSelect,
      orderBy: [{ sequenceOrder: "asc" }, { source: "asc" }],
    });
  }

  static async findManyByIds(ids: string[]) {
    return pgsql.checklistResult.findMany({
      where: { id: { in: ids } },
      select: { id: true, tankProcessId: true, status: true },
    });
  }

  static async checkOne(id: string, userId: string, remarks?: string) {
    return pgsql.checklistResult.update({
      where: { id },
      data: {
        status: ChecklistStatusEnum.PASSED,
        checkedBy: userId,
        checkedAt: new Date(),
        ...(remarks !== undefined && { remarks }),
      },
      select: checklistSelect,
    });
  }

  static async bulkCheck(ids: string[], userId: string) {
    const now = new Date();
    await pgsql.checklistResult.updateMany({
      where: { id: { in: ids } },
      data: {
        status: ChecklistStatusEnum.PASSED,
        checkedBy: userId,
        checkedAt: now,
      },
    });
    return pgsql.checklistResult.findMany({
      where: { id: { in: ids } },
      select: checklistSelect,
    });
  }

  static async resetOne(id: string) {
    return pgsql.checklistResult.update({
      where: { id },
      data: {
        status: ChecklistStatusEnum.NOT_CHECKED,
        checkedBy: null,
        checkedAt: null,
      },
      select: checklistSelect,
    });
  }

  static async createCustom(tankProcessId: string, data: AddCustomChecklistRequest) {
    return pgsql.checklistResult.create({
      data: {
        tankProcessId,
        source: ChecklistSourceEnum.CUSTOM,
        status: ChecklistStatusEnum.NOT_CHECKED,
        customName: data.name,
        customDescription: data.description ?? null,
        customAcceptanceText: data.acceptanceText ?? null,
        customMethod: data.method ?? null,
        customReferenceText: data.referenceText ?? null,
        isRequired: data.isRequired,
        sequenceOrder: data.sequenceOrder,
        remarks: data.remarks ?? null,
      },
      select: checklistSelect,
    });
  }

  static async countUncheckedRequired(tankProcessId: string) {
    return pgsql.checklistResult.count({
      where: {
        tankProcessId,
        status: ChecklistStatusEnum.NOT_CHECKED,
        OR: [
          { source: ChecklistSourceEnum.TEMPLATE, criteria: { isRequired: true } },
          { source: ChecklistSourceEnum.CUSTOM, isRequired: true },
        ],
      },
    });
  }
}
