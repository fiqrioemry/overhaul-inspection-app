// src/features/process-templates/process-templates.api.ts
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/pagination.type";
import type { ResponseSuccess, ResponseList, ResponseOK } from "@/types/response.type";

export interface ProcessTemplate {
  id: string;
  code: string;
  name: string;
  type: string;
  sequenceOrder: number;
  isOptional: boolean;
  applicabilityRule: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProcessCriteriaTemplate {
  id: string;
  processTemplateId: string;
  criteriaId: string;
  sequenceOrder: number;
  isRequired: boolean;
  criteria: { id: string; code: string; name: string; acceptanceType: string };
}

export interface ProcessDependency {
  id: string;
  processTemplateId: string;
  dependsOnId: string;
  requiredStatus: string;
  isRequired: boolean;
  applicabilityRule: string | null;
  dependsOn: { id: string; code: string; name: string; sequenceOrder: number };
}

export interface ListProcessTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

export interface CreateProcessTemplatePayload {
  code: string;
  name: string;
  type: string;
  sequenceOrder: number;
  isOptional?: boolean;
  applicabilityRule?: string;
  isActive?: boolean;
}

export interface UpdateProcessTemplatePayload extends Partial<CreateProcessTemplatePayload> {}

export interface AddCriteriaToTemplatePayload {
  criteriaId: string;
  sequenceOrder?: number;
  isRequired?: boolean;
}

export interface UpdateCriteriaTemplatePayload {
  sequenceOrder?: number;
  isRequired?: boolean;
}

export interface AddDependencyPayload {
  dependsOnId: string;
  requiredStatus?: string;
  isRequired?: boolean;
  applicabilityRule?: string;
}

export async function listProcessTemplates(params: ListProcessTemplatesParams): Promise<PaginatedResponse<ProcessTemplate>> {
  const res = await api.get<ResponseList<ProcessTemplate>>("/process-templates", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getAllProcessTemplates(): Promise<ProcessTemplate[]> {
  const PAGE_SIZE = 100;
  let page = 1;
  const collected: ProcessTemplate[] = [];
  while (true) {
    const res = await api.get<ResponseList<ProcessTemplate>>("/process-templates", { params: { limit: PAGE_SIZE, page } });
    collected.push(...res.data.data);
    if (collected.length >= res.data.meta.total) break;
    page++;
  }
  return collected;
}

export async function getProcessTemplateById(id: string): Promise<ProcessTemplate> {
  const res = await api.get<ResponseSuccess<ProcessTemplate>>(`/process-templates/${id}`);
  return res.data.data!;
}

export async function createProcessTemplate(data: CreateProcessTemplatePayload): Promise<ProcessTemplate> {
  const res = await api.post<ResponseSuccess<ProcessTemplate>>("/process-templates", data);
  return res.data.data!;
}

export async function updateProcessTemplate(id: string, data: UpdateProcessTemplatePayload): Promise<ProcessTemplate> {
  const res = await api.patch<ResponseSuccess<ProcessTemplate>>(`/process-templates/${id}`, data);
  return res.data.data!;
}

export async function deleteProcessTemplate(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/process-templates/${id}`);
  return res.data;
}

export async function getTemplateCriteria(processTemplateId: string): Promise<ProcessCriteriaTemplate[]> {
  const res = await api.get<ResponseSuccess<ProcessCriteriaTemplate[]>>(`/process-templates/${processTemplateId}/criteria`);
  return res.data.data!;
}

export async function addCriteriaToTemplate(processTemplateId: string, data: AddCriteriaToTemplatePayload): Promise<ProcessCriteriaTemplate> {
  const res = await api.post<ResponseSuccess<ProcessCriteriaTemplate>>(`/process-templates/${processTemplateId}/criteria`, data);
  return res.data.data!;
}

export async function updateTemplateCriteria(id: string, data: UpdateCriteriaTemplatePayload): Promise<ProcessCriteriaTemplate> {
  const res = await api.patch<ResponseSuccess<ProcessCriteriaTemplate>>(`/process-template-criteria/${id}`, data);
  return res.data.data!;
}

export async function removeTemplateCriteria(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/process-template-criteria/${id}`);
  return res.data;
}

export async function getTemplateDependencies(processTemplateId: string): Promise<ProcessDependency[]> {
  const res = await api.get<ResponseSuccess<ProcessDependency[]>>(`/process-templates/${processTemplateId}/dependencies`);
  return res.data.data!;
}

export async function addTemplateDependency(processTemplateId: string, data: AddDependencyPayload): Promise<ProcessDependency> {
  const res = await api.post<ResponseSuccess<ProcessDependency>>(`/process-templates/${processTemplateId}/dependencies`, data);
  return res.data.data!;
}

export async function removeTemplateDependency(id: string): Promise<ResponseOK> {
  const res = await api.delete<ResponseOK>(`/process-dependencies/${id}`);
  return res.data;
}
