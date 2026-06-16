// src/features/checklist-results/checklist-results.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type ChecklistStatus = "NOT_CHECKED" | "PASSED";
export type ChecklistSource = "TEMPLATE" | "CUSTOM";

export interface ChecklistCriteriaRef {
  documentCode: string;
  documentTitle: string;
  clause: string | null;
  page: string | null;
  notes: string | null;
}

export interface ChecklistCriteriaDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  acceptanceType: string;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  acceptanceText: string | null;
  method: string | null;
  tools: string | null;
  severity: string;
  isRequired: boolean;
  references: ChecklistCriteriaRef[];
}

export interface ChecklistResult {
  id: string;
  tankProcessId: string;
  criteriaId: string | null;
  source: ChecklistSource;
  status: ChecklistStatus;
  isRequired: boolean;
  sequenceOrder: number;
  customName: string | null;
  customDescription: string | null;
  customAcceptanceText: string | null;
  customMethod: string | null;
  customReferenceText: string | null;
  remarks: string | null;
  checkedAt: string | null;
  checkedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  criteria: ChecklistCriteriaDetail | null;
  nameDisplay: string;
  acceptanceDisplay: string;
  methodDisplay: string;
  referenceDisplay: string;
}

export interface CheckChecklistPayload {
  remarks?: string;
}

export interface BulkCheckPayload {
  checklistIds: string[];
}

export interface AddCustomChecklistPayload {
  name: string;
  description?: string;
  acceptanceText?: string;
  method?: string;
  referenceText?: string;
  isRequired?: boolean;
  sequenceOrder?: number;
  remarks?: string;
}

export async function getChecklistResults(processId: string): Promise<ChecklistResult[]> {
  const res = await api.get<ResponseSuccess<ChecklistResult[]>>(`/processes/${processId}/checklist`);
  return res.data.data!;
}

export async function checkChecklist(processId: string, checklistId: string, data: CheckChecklistPayload): Promise<ChecklistResult> {
  const res = await api.patch<ResponseSuccess<ChecklistResult>>(`/processes/${processId}/checklists/${checklistId}/check`, data);
  return res.data.data!;
}

export async function bulkCheckChecklists(processId: string, data: BulkCheckPayload): Promise<ChecklistResult[]> {
  const res = await api.patch<ResponseSuccess<ChecklistResult[]>>(`/processes/${processId}/checklists/bulk-check`, data);
  return res.data.data!;
}

export async function resetChecklist(processId: string, checklistId: string): Promise<ChecklistResult> {
  const res = await api.patch<ResponseSuccess<ChecklistResult>>(`/processes/${processId}/checklists/${checklistId}/reset`);
  return res.data.data!;
}

export async function addCustomChecklist(processId: string, data: AddCustomChecklistPayload): Promise<ChecklistResult> {
  const res = await api.post<ResponseSuccess<ChecklistResult>>(`/processes/${processId}/checklists/custom`, data);
  return res.data.data!;
}
