// src/features/process-templates/process-templates.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listProcessTemplates,
  getAllProcessTemplates,
  getProcessTemplateById,
  createProcessTemplate,
  updateProcessTemplate,
  deleteProcessTemplate,
  getTemplateCriteria,
  addCriteriaToTemplate,
  updateTemplateCriteria,
  removeTemplateCriteria,
  getTemplateDependencies,
  addTemplateDependency,
  removeTemplateDependency,
} from "./process-templates.api";
import type {
  ListProcessTemplatesParams,
  CreateProcessTemplatePayload,
  UpdateProcessTemplatePayload,
  AddCriteriaToTemplatePayload,
  UpdateCriteriaTemplatePayload,
  AddDependencyPayload,
} from "./process-templates.api";

export const PROCESS_TEMPLATE_KEYS = {
  all: ["process-templates"] as const,
  list: (params: ListProcessTemplatesParams) => ["process-templates", "list", params] as const,
  allList: ["process-templates", "all"] as const,
  detail: (id: string) => ["process-templates", "detail", id] as const,
  criteria: (id: string) => ["process-templates", "criteria", id] as const,
  dependencies: (id: string) => ["process-templates", "dependencies", id] as const,
};

export function useProcessTemplates(params: ListProcessTemplatesParams) {
  return useQuery({
    queryKey: PROCESS_TEMPLATE_KEYS.list(params),
    queryFn: () => listProcessTemplates(params),
    staleTime: 1000 * 30,
  });
}

export function useAllProcessTemplates() {
  return useQuery({
    queryKey: PROCESS_TEMPLATE_KEYS.allList,
    queryFn: () => getAllProcessTemplates(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useProcessTemplateById(id: string) {
  return useQuery({
    queryKey: PROCESS_TEMPLATE_KEYS.detail(id),
    queryFn: () => getProcessTemplateById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}

export function useCreateProcessTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProcessTemplatePayload) => createProcessTemplate(data),
    onSuccess: () => {
      toast.success("Process template created successfully");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateProcessTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessTemplatePayload }) => updateProcessTemplate(id, data),
    onSuccess: () => {
      toast.success("Process template updated successfully");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteProcessTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProcessTemplate(id),
    onSuccess: (res) => {
      toast.success(res.message || "Process template deleted successfully");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useTemplateCriteria(id: string) {
  return useQuery({
    queryKey: PROCESS_TEMPLATE_KEYS.criteria(id),
    queryFn: () => getTemplateCriteria(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useAddCriteriaToTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processTemplateId, data }: { processTemplateId: string; data: AddCriteriaToTemplatePayload }) =>
      addCriteriaToTemplate(processTemplateId, data),
    onSuccess: (_, vars) => {
      toast.success("Criteria added to template");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.criteria(vars.processTemplateId) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateTemplateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId: _templateId, data }: { id: string; templateId: string; data: UpdateCriteriaTemplatePayload }) =>
      updateTemplateCriteria(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.criteria(vars.templateId) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveTemplateCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId: _templateId }: { id: string; templateId: string }) => removeTemplateCriteria(id),
    onSuccess: (res, vars) => {
      toast.success(res.message || "Criteria removed");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.criteria(vars.templateId) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useTemplateDependencies(id: string) {
  return useQuery({
    queryKey: PROCESS_TEMPLATE_KEYS.dependencies(id),
    queryFn: () => getTemplateDependencies(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useAddTemplateDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ processTemplateId, data }: { processTemplateId: string; data: AddDependencyPayload }) =>
      addTemplateDependency(processTemplateId, data),
    onSuccess: (_, vars) => {
      toast.success("Dependency added");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.dependencies(vars.processTemplateId) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useRemoveTemplateDependency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, templateId: _templateId }: { id: string; templateId: string }) => removeTemplateDependency(id),
    onSuccess: (res, vars) => {
      toast.success(res.message || "Dependency removed");
      queryClient.invalidateQueries({ queryKey: PROCESS_TEMPLATE_KEYS.dependencies(vars.templateId) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
