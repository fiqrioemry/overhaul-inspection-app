// src/features/tank-processes/tank-processes.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type ProcessStatus =
  | "LOCKED"
  | "NOT_STARTED"
  | "WAITING_REVIEW"
  | "REVIEWED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "NOT_APPLICABLE";

export type ProcessResult = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";

export type ProcessType = "WORK" | "INSPECTION" | "TEST" | "NDT" | "COATING" | "COMMISSIONING";

export interface ProcessTemplate {
  id: string;
  code: string;
  name: string;
  type: ProcessType;
  sequenceOrder: number;
  isOptional: boolean;
}

export interface TankProcessSummary {
  id: string;
  tankId: string;
  status: ProcessStatus;
  result: ProcessResult;
  startedAt: string | null;
  completedAt: string | null;
  processTemplate: ProcessTemplate;
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
}

export interface UpdateProcessResultPayload {
  result: ProcessResult;
  remarks?: string;
  actualFinishDate?: string;
}

export async function getTankProcesses(tankId: string): Promise<TankProcessSummary[]> {
  const res = await api.get<ResponseSuccess<TankProcessSummary[]>>(`/tanks/${tankId}/processes`);
  return res.data.data!;
}

export async function getTankProcessById(id: string): Promise<TankProcessDetail> {
  const res = await api.get<ResponseSuccess<TankProcessDetail>>(`/tank-processes/${id}`);
  return res.data.data!;
}

export async function updateProcessStatus(id: string, data: UpdateProcessStatusPayload): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/tank-processes/${id}/status`, data);
  return res.data.data!;
}

export async function updateProcessResult(id: string, data: UpdateProcessResultPayload): Promise<TankProcessDetail> {
  const res = await api.patch<ResponseSuccess<TankProcessDetail>>(`/tank-processes/${id}/result`, data);
  return res.data.data!;
}

export async function getProcessEligibility(id: string): Promise<EligibilityResult> {
  const res = await api.get<ResponseSuccess<EligibilityResult>>(`/tank-processes/${id}/eligibility`);
  return res.data.data!;
}
