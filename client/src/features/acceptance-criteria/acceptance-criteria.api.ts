// src/features/acceptance-criteria/acceptance-criteria.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";

export interface CriteriaReference {
  id: string;
  criteriaId: string;
  referenceDocumentId: string;
  clause: string | null;
  referenceDocument: { id: string; code: string; title: string };
}

export interface AcceptanceCriteria {
  id: string;
  code: string;
  name: string;
  description: string | null;
  acceptanceType: string;
  operator: string | null;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  acceptanceText: string | null;
  method: string | null;
  tools: string | null;
  isCountable: boolean;
  isRequired: boolean;
  severity: string | null;
  status: string;
  createdAt: string;
  references: CriteriaReference[];
}

export interface ListAcceptanceCriteriaParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  acceptanceType?: string;
}

export interface CreateAcceptanceCriteriaPayload {
  code: string;
  name: string;
  description?: string;
  acceptanceType: string;
  minValue?: number;
  maxValue?: number;
  unit?: string;
  acceptanceText?: string;
  method?: string;
  tools?: string;
  isCountable?: boolean;
  isRequired?: boolean;
  severity?: string;
  status?: string;
}

export interface UpdateAcceptanceCriteriaPayload extends Partial<CreateAcceptanceCriteriaPayload> {}

export interface AddCriteriaReferencePayload {
  referenceDocumentId: string;
  clause?: string;
}

export async function listAcceptanceCriteria(params: ListAcceptanceCriteriaParams): Promise<PaginatedResponse<AcceptanceCriteria>> {
  const res = await api.get<ResponseList<AcceptanceCriteria>>("/acceptance-criteria", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getAcceptanceCriteriaById(id: string): Promise<AcceptanceCriteria> {
  const res = await api.get<ResponseSuccess<AcceptanceCriteria>>(`/acceptance-criteria/${id}`);
  return res.data.data!;
}

export async function createAcceptanceCriteria(data: CreateAcceptanceCriteriaPayload): Promise<AcceptanceCriteria> {
  const res = await api.post<ResponseSuccess<AcceptanceCriteria>>("/acceptance-criteria", data);
  return res.data.data!;
}

export async function updateAcceptanceCriteria(id: string, data: UpdateAcceptanceCriteriaPayload): Promise<AcceptanceCriteria> {
  const res = await api.patch<ResponseSuccess<AcceptanceCriteria>>(`/acceptance-criteria/${id}`, data);
  return res.data.data!;
}

export async function deleteAcceptanceCriteria(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/acceptance-criteria/${id}`);
  return res.data;
}

export async function addCriteriaReference(criteriaId: string, data: AddCriteriaReferencePayload): Promise<CriteriaReference> {
  const res = await api.post<ResponseSuccess<CriteriaReference>>(`/acceptance-criteria/${criteriaId}/references`, data);
  return res.data.data!;
}

export async function getCriteriaReferences(criteriaId: string): Promise<CriteriaReference[]> {
  const res = await api.get<ResponseSuccess<CriteriaReference[]>>(`/acceptance-criteria/${criteriaId}/references`);
  return res.data.data!;
}

export async function deleteCriteriaReference(criteriaId: string, refId: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/acceptance-criteria/${criteriaId}/references/${refId}`);
  return res.data;
}
