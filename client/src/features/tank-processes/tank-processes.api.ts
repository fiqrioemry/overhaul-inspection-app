// src/features/tank-processes/tank-processes.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export type ProcessStatus = "LOCKED" | "NOT_STARTED" | "WAITING_REVIEW" | "REVIEWED" | "IN_PROGRESS" | "COMPLETED";

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
  plannedStartDate: string | null;
  actualStartDate: string | null;
  actualFinishDate: string | null;
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

export async function getProcessEligibility(id: string): Promise<EligibilityResult> {
  const res = await api.get<ResponseSuccess<EligibilityResult>>(`/processes/${id}/eligibility`);
  return res.data.data!;
}
