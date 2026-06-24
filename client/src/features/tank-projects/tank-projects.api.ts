// src/features/tank-projects/tank-projects.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess, ResponseOK } from "@/types/response.type";

export type TankProjectType = "NEW_BUILD" | "OVERHAUL" | "REPAIR" | "ROUTINE_INSPECTION";
export type TankProjectStatus = "PLANNED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export interface TankProjectDetail {
  id: string;
  projectNo: string;
  tankId: string;
  type: TankProjectType;
  status: TankProjectStatus;
  startDate: string | null;
  estimatedFinishDate: string | null;
  actualFinishDate: string | null;
  description: string | null;
  remarks: string | null;
}

export interface CreateTankProjectPayload {
  tankId: string;
  projectNo?: string;
  type: TankProjectType;
  status?: TankProjectStatus;
  contractorCompanyId?: string;
  inspectionCompanyId?: string;
  startDate?: string;
  estimatedFinishDate?: string;
  description?: string;
  remarks?: string;
  generateProcesses?: boolean;
  // When set, only these process templates are generated; otherwise the full set.
  processTemplateIds?: string[];
}

export async function createTankProject(data: CreateTankProjectPayload): Promise<TankProjectDetail> {
  const res = await api.post<ResponseSuccess<TankProjectDetail>>("/tank-projects", data);
  return res.data.data!;
}

export async function generateProjectProcesses(id: string): Promise<{ generated: number }> {
  const res = await api.post<ResponseSuccess<{ generated: number }>>(`/tank-projects/${id}/generate-processes`, {});
  return res.data.data!;
}

export async function deleteTankProject(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/tank-projects/${id}`);
  return res.data;
}
