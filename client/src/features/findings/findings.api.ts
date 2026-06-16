// src/features/findings/findings.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type FindingStatus = "OPEN" | "IN_REPAIR" | "REPAIRED" | "VERIFIED" | "CLOSED";
export type FindingSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export interface FindingSummary {
  id: string;
  findingNo: string;
  tankId: string;
  tankProcessId: string;
  criteriaId: string | null;
  title: string;
  description: string | null;
  locationDetail: string | null;
  severity: FindingSeverity;
  status: FindingStatus;
  isBlocking: boolean;
  createdAt: string;
  updatedAt: string;
  tank: { id: string; tankNo: string };
  tankProcess: { id: string; name: string };
  criteria: { id: string; code: string; name: string } | null;
  createdByUser: { id: string; name: string };
}

export interface FindingDetail extends FindingSummary {
  closedByUser: { id: string; name: string } | null;
}

export interface ListFindingsParams {
  tankId?: string;
  tankProcessId?: string;
  status?: FindingStatus;
  severity?: FindingSeverity;
  page?: number;
  limit?: number;
}

export interface CreateFindingPayload {
  tankId: string;
  tankProcessId: string;
  criteriaId?: string;
  title: string;
  description?: string;
  locationDetail?: string;
  severity?: FindingSeverity;
  isBlocking?: boolean;
  fileIds?: string[];
}

export interface UpdateFindingPayload {
  title?: string;
  description?: string;
  locationDetail?: string;
  severity?: FindingSeverity;
  isBlocking?: boolean;
  fileIds?: string[];
}

export interface UpdateFindingStatusPayload {
  status: FindingStatus;
  remarks?: string;
}

export async function listFindings(params: ListFindingsParams): Promise<PaginatedResponse<FindingSummary>> {
  const res = await api.get<ResponseSuccess<PaginatedResponse<FindingSummary>>>("/findings", { params });
  return res.data.data!;
}

export async function getFindingById(id: string): Promise<FindingDetail> {
  const res = await api.get<ResponseSuccess<FindingDetail>>(`/findings/${id}`);
  return res.data.data!;
}

export async function createFinding(data: CreateFindingPayload): Promise<FindingDetail> {
  const res = await api.post<ResponseSuccess<FindingDetail>>("/findings", data);
  return res.data.data!;
}

export async function updateFinding(id: string, data: UpdateFindingPayload): Promise<FindingDetail> {
  const res = await api.patch<ResponseSuccess<FindingDetail>>(`/findings/${id}`, data);
  return res.data.data!;
}

export async function updateFindingStatus(id: string, data: UpdateFindingStatusPayload): Promise<FindingDetail> {
  const res = await api.patch<ResponseSuccess<FindingDetail>>(`/findings/${id}/status`, data);
  return res.data.data!;
}

export async function deleteFinding(id: string): Promise<void> {
  await api.delete(`/findings/${id}`);
}
