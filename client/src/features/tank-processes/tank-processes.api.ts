// src/features/tank-processes/tank-processes.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess, ResponseOK } from "@/types/response.type";

export type ProcessStatus = "NOT_STARTED" | "WAITING_REVIEW" | "REVIEWED" | "IN_PROGRESS" | "COMPLETED";

export type ProcessType = "WORK" | "INSPECTION" | "TEST" | "NDT" | "COATING" | "COMMISSIONING";

export interface ProcessTemplate {
  code: string;
  isOptional: boolean;
  applicabilityRule: string | null;
}

export interface TankProcessSummary {
  id: string;
  tankId: string;
  processTemplateId: string;
  name: string;
  type: ProcessType;
  sequenceOrder: number;
  status: ProcessStatus;
  startDate: string | null;
  finishDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  processTemplate: ProcessTemplate;
  _count: { checklistResults: number; findings: number };
}

export interface TankProcessDetail extends TankProcessSummary {
  tank: { id: string; tankNo: string; tankName: string | null };
}

export interface EligibilityReason {
  type: string;
  message: string;
  targetId?: string;
}

export interface EligibilityResult {
  eligible: boolean;
  reasons: EligibilityReason[];
}

export interface UpdateProcessStatusPayload {
  status: ProcessStatus;
  // Only meaningful for the NOT_STARTED -> IN_PROGRESS transition.
  startDate?: string;
  // undefined = leave untouched; null = clear it.
  finishDate?: string | null;
}

export interface UpdateProcessDatesPayload {
  startDate: string;
  finishDate?: string | null;
}

// Manual status correction. Carries no dates — the server derives every timestamp from
// targetStatus. expectedCurrentStatus is the status shown when the dialog was opened; the
// server rejects the write with 409 if the row no longer holds it.
export interface CorrectProcessStatusPayload {
  targetStatus: ProcessStatus;
  expectedCurrentStatus: ProcessStatus;
}

export async function getTankProcesses(tankId: string): Promise<TankProcessSummary[]> {
  const res = await api.get<ResponseSuccess<TankProcessSummary[]>>(`/tanks/${tankId}/processes`);
  return res.data.data!;
}

export async function getTankProcessById(id: string): Promise<TankProcessDetail> {
  const res = await api.get<ResponseSuccess<TankProcessDetail>>(`/processes/${id}`);
  return res.data.data!;
}

export async function updateProcessStatus(id: string, data: UpdateProcessStatusPayload): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/processes/${id}/status`, data);
  return res.data.data!;
}

export async function updateProcessDates(id: string, data: UpdateProcessDatesPayload): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/processes/${id}/dates`, data);
  return res.data.data!;
}

// Direct-completion shortcut: transitions NOT_STARTED/IN_PROGRESS/WAITING_REVIEW/REVIEWED
// straight to COMPLETED in one call, bypassing checklist/review requirements.
export async function completeProcessDirect(id: string): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/processes/${id}/complete`, {});
  return res.data.data!;
}

// Administrative correction of a wrongly-recorded status, e.g. COMPLETED -> IN_PROGRESS.
// Separate endpoint from updateProcessStatus, which performs the guarded workflow transition.
export async function correctProcessStatus(tankId: string, processId: string, data: CorrectProcessStatusPayload): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/tanks/${tankId}/processes/${processId}/status`, data);
  return res.data.data!;
}

export async function getProcessEligibility(id: string): Promise<EligibilityResult> {
  const res = await api.get<ResponseSuccess<EligibilityResult>>(`/processes/${id}/eligibility`);
  return res.data.data!;
}

export async function deleteTankProcess(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/processes/${id}`);
  return res.data;
}
