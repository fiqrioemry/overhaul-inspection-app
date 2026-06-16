// src/features/findings/findings.api.ts
import api from "@/lib/axios";
import type { ResponseList, ResponseSuccess } from "@/types/response.type";
import type { PaginatedResponse } from "@/types/pagination.type";

export type FindingStatus = "OPEN" | "IN_REPAIR" | "REPAIRED" | "VERIFIED" | "CLOSED" | "REJECTED";
export type FindingSeverity = "MINOR" | "MAJOR" | "CRITICAL";

export interface FindingAttachment {
  id: string;
  url: string;
  path: string;
  module: string;
  isUsed: boolean;
  createdAt: string;
}

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
  createdByUser: { id: string; name: string } | null;
}

export interface FindingDetail extends Omit<FindingSummary, "tank" | "tankProcess"> {
  tank: { id: string; tankNo: string; tankName: string | null };
  tankProcess: { id: string; name: string; type: string; status: string };
  closedByUser: { id: string; name: string } | null;
  attachments: FindingAttachment[];
}

export interface ListFindingsParams {
  tankId?: string;
  tankProcessId?: string;
  status?: FindingStatus;
  severity?: FindingSeverity;
  isBlocking?: boolean;
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
  const res = await api.get<ResponseList<FindingSummary>>("/findings", { params });
  return { items: res.data.data, meta: res.data.meta };
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

export interface BulkCloseFindingsPayload {
  ids: string[];
  remarks?: string;
}

export interface BulkCloseFindingsResult {
  closed: number;
  skipped: number;
}

export async function bulkCloseFindings(data: BulkCloseFindingsPayload): Promise<BulkCloseFindingsResult> {
  const res = await api.patch<ResponseSuccess<BulkCloseFindingsResult>>("/findings/bulk-close", data);
  return res.data.data!;
}
