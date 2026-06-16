// src/features/checklist-results/checklist-results.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type ChecklistStatus = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";

export interface ChecklistCriteria {
  id: string;
  code: string;
  name: string;
  acceptanceValue: string | null;
  method: string | null;
  tools: string | null;
  referenceDocument: { id: string; code: string; title: string } | null;
}

export interface ChecklistResult {
  id: string;
  tankProcessId: string;
  criteriaId: string;
  actualValue: string | null;
  status: ChecklistStatus;
  remarks: string | null;
  checkedBy: string | null;
  checkedAt: string | null;
  criteria: ChecklistCriteria;
}

export interface UpdateChecklistResultPayload {
  actualValue?: string;
  status?: ChecklistStatus;
  remarks?: string;
}

export async function getChecklistResults(processId: string): Promise<ChecklistResult[]> {
  const res = await api.get<ResponseSuccess<ChecklistResult[]>>(`/processes/${processId}/checklist`);
  return res.data.data!;
}

export async function updateChecklistResult(id: string, data: UpdateChecklistResultPayload): Promise<ChecklistResult> {
  const res = await api.patch<ResponseSuccess<ChecklistResult>>(`/checklist-results/${id}`, data);
  return res.data.data!;
}
