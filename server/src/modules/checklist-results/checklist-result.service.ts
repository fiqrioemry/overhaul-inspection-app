import { HTTPException } from "hono/http-exception";
import { ProcessStatusEnum } from "generated/prisma";
import { pgsql } from "@/lib/database";
import { ChecklistResultRepository } from "./checklist-result.repository";
import type { CheckChecklistRequest, BulkCheckRequest, AddCustomChecklistRequest } from "./checklist-result.schema";
import type { ChecklistResultItem, ChecklistCriteriaDetail } from "./checklist-result.types";

type RawRow = Awaited<ReturnType<typeof ChecklistResultRepository.findByTankProcess>>[number];

function buildAcceptanceDisplay(criteria: ChecklistCriteriaDetail | null, customAcceptanceText: string | null): string {
  if (customAcceptanceText) return customAcceptanceText;
  if (!criteria) return "—";
  if (criteria.acceptanceText) return criteria.acceptanceText;
  const { minValue, maxValue, unit } = criteria;
  const u = unit ? ` ${unit}` : "";
  if (minValue != null && maxValue != null) return `${minValue} - ${maxValue}${u}`;
  if (minValue != null) return `min ${minValue}${u}`;
  if (maxValue != null) return `max ${maxValue}${u}`;
  return criteria.name;
}

function buildMethodDisplay(criteria: ChecklistCriteriaDetail | null, customMethod: string | null): string {
  if (customMethod) return customMethod;
  return criteria?.method ?? "—";
}

function buildReferenceDisplay(criteria: ChecklistCriteriaDetail | null, customReferenceText: string | null): string {
  if (customReferenceText) return customReferenceText;
  if (!criteria || criteria.references.length === 0) return "—";
  return criteria.references
    .map((r) => {
      let s = r.documentCode;
      if (r.clause) s += ` Cl. ${r.clause}`;
      if (r.page) s += ` p.${r.page}`;
      return s;
    })
    .join(" / ");
}

function mapToItem(raw: RawRow): ChecklistResultItem {
  const criteria: ChecklistCriteriaDetail | null = raw.criteria
    ? {
        id: raw.criteria.id,
        code: raw.criteria.code,
        name: raw.criteria.name,
        description: raw.criteria.description,
        acceptanceType: raw.criteria.acceptanceType,
        operator: raw.criteria.operator,
        minValue: raw.criteria.minValue,
        maxValue: raw.criteria.maxValue,
        unit: raw.criteria.unit,
        acceptanceText: raw.criteria.acceptanceText,
        method: raw.criteria.method,
        tools: raw.criteria.tools,
        severity: raw.criteria.severity,
        isRequired: raw.criteria.isRequired,
        references: raw.criteria.criteriaRefs.map((r) => ({
          documentCode: r.referenceDocument.code,
          documentTitle: r.referenceDocument.title,
          clause: r.clause,
          page: r.page,
          notes: r.notes,
        })),
      }
    : null;

  return {
    id: raw.id,
    tankProcessId: raw.tankProcessId,
    criteriaId: raw.criteriaId,
    source: raw.source as "TEMPLATE" | "CUSTOM",
    status: raw.status as "NOT_CHECKED" | "PASSED",
    isRequired: raw.isRequired,
    sequenceOrder: raw.sequenceOrder,
    customName: raw.customName,
    customDescription: raw.customDescription,
    customAcceptanceText: raw.customAcceptanceText,
    customMethod: raw.customMethod,
    customReferenceText: raw.customReferenceText,
    remarks: raw.remarks,
    checkedAt: raw.checkedAt,
    checkedBy: raw.checkedByUser,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    criteria,
    nameDisplay: raw.customName ?? criteria?.name ?? "—",
    acceptanceDisplay: buildAcceptanceDisplay(criteria, raw.customAcceptanceText),
    methodDisplay: buildMethodDisplay(criteria, raw.customMethod),
    referenceDisplay: buildReferenceDisplay(criteria, raw.customReferenceText),
  };
}

async function requireProcess(tankProcessId: string) {
  const process = await pgsql.tankProcess.findUnique({
    where: { id: tankProcessId },
    select: { id: true, status: true },
  });
  if (!process) throw new HTTPException(404, { message: "Process not found", cause: "PROCESS_NOT_FOUND" });
  return process;
}

export class ChecklistResultService {
  static async getChecklistByProcess(tankProcessId: string): Promise<ChecklistResultItem[]> {
    const rows = await ChecklistResultRepository.findByTankProcess(tankProcessId);
    return rows.map(mapToItem);
  }

  static async checkOne(tankProcessId: string, checklistId: string, data: CheckChecklistRequest, userId: string) {
    const process = await requireProcess(tankProcessId);
    if (process.status !== ProcessStatusEnum.IN_PROGRESS) {
      throw new HTTPException(409, {
        message: `Cannot check checklist: process status is ${process.status}. Must be IN_PROGRESS.`,
        cause: "INVALID_PROCESS_STATUS",
      });
    }
    const item = await ChecklistResultRepository.findById(checklistId);
    if (!item || item.tankProcess.id !== tankProcessId) {
      throw new HTTPException(404, { message: "Checklist item not found", cause: "CHECKLIST_NOT_FOUND" });
    }
    const updated = await ChecklistResultRepository.checkOne(checklistId, userId, data.remarks);
    return mapToItem(updated as RawRow);
  }

  static async bulkCheck(tankProcessId: string, data: BulkCheckRequest, userId: string) {
    const process = await requireProcess(tankProcessId);
    if (process.status !== ProcessStatusEnum.IN_PROGRESS) {
      throw new HTTPException(409, {
        message: `Cannot check checklists: process status is ${process.status}. Must be IN_PROGRESS.`,
        cause: "INVALID_PROCESS_STATUS",
      });
    }
    const items = await ChecklistResultRepository.findManyByIds(data.checklistIds);
    const outsiders = items.filter((i) => i.tankProcessId !== tankProcessId);
    if (outsiders.length > 0) {
      throw new HTTPException(422, {
        message: "Some checklist IDs do not belong to this process",
        cause: "CHECKLIST_PROCESS_MISMATCH",
      });
    }
    const rows = await ChecklistResultRepository.bulkCheck(data.checklistIds, userId);
    return rows.map((r) => mapToItem(r as RawRow));
  }

  static async resetOne(tankProcessId: string, checklistId: string) {
    const process = await requireProcess(tankProcessId);
    if (process.status === ProcessStatusEnum.COMPLETED) {
      throw new HTTPException(409, {
        message: "Cannot reset checklist: process is already COMPLETED.",
        cause: "PROCESS_COMPLETED",
      });
    }
    const item = await ChecklistResultRepository.findById(checklistId);
    if (!item || item.tankProcess.id !== tankProcessId) {
      throw new HTTPException(404, { message: "Checklist item not found", cause: "CHECKLIST_NOT_FOUND" });
    }
    const updated = await ChecklistResultRepository.resetOne(checklistId);
    return mapToItem(updated as RawRow);
  }

  static async addCustom(tankProcessId: string, data: AddCustomChecklistRequest) {
    const process = await requireProcess(tankProcessId);
    if (process.status === ProcessStatusEnum.COMPLETED) {
      throw new HTTPException(409, {
        message: "Cannot add checklist item: process is already COMPLETED.",
        cause: "PROCESS_COMPLETED",
      });
    }
    const created = await ChecklistResultRepository.createCustom(tankProcessId, data);
    return mapToItem(created as RawRow);
  }
}
