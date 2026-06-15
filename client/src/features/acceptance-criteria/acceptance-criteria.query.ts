// src/features/acceptance-criteria/acceptance-criteria.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAcceptanceCriteria,
  getAcceptanceCriteriaById,
  createAcceptanceCriteria,
  updateAcceptanceCriteria,
  deleteAcceptanceCriteria,
  addCriteriaReference,
  getCriteriaReferences,
  deleteCriteriaReference,
} from "./acceptance-criteria.api";
import type {
  ListAcceptanceCriteriaParams,
  CreateAcceptanceCriteriaPayload,
  UpdateAcceptanceCriteriaPayload,
  AddCriteriaReferencePayload,
} from "./acceptance-criteria.api";

export const ACCEPTANCE_CRITERIA_KEYS = {
  all: ["acceptance-criteria"] as const,
  list: (params: ListAcceptanceCriteriaParams) => ["acceptance-criteria", "list", params] as const,
  detail: (id: string) => ["acceptance-criteria", "detail", id] as const,
  references: (criteriaId: string) => ["acceptance-criteria", "references", criteriaId] as const,
};

export function useAcceptanceCriteria(params: ListAcceptanceCriteriaParams) {
  return useQuery({
    queryKey: ACCEPTANCE_CRITERIA_KEYS.list(params),
    queryFn: () => listAcceptanceCriteria(params),
    staleTime: 1000 * 30,
  });
}

export function useAcceptanceCriteriaById(id: string) {
  return useQuery({
    queryKey: ACCEPTANCE_CRITERIA_KEYS.detail(id),
    queryFn: () => getAcceptanceCriteriaById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}

export function useCreateAcceptanceCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAcceptanceCriteriaPayload) => createAcceptanceCriteria(data),
    onSuccess: () => {
      toast.success("Acceptance criteria created successfully");
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateAcceptanceCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAcceptanceCriteriaPayload }) => updateAcceptanceCriteria(id, data),
    onSuccess: () => {
      toast.success("Acceptance criteria updated successfully");
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteAcceptanceCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAcceptanceCriteria(id),
    onSuccess: (res) => {
      toast.success(res.message || "Acceptance criteria deleted successfully");
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useCriteriaReferences(criteriaId: string) {
  return useQuery({
    queryKey: ACCEPTANCE_CRITERIA_KEYS.references(criteriaId),
    queryFn: () => getCriteriaReferences(criteriaId),
    enabled: Boolean(criteriaId),
    staleTime: 1000 * 30,
  });
}

export function useAddCriteriaReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ criteriaId, data }: { criteriaId: string; data: AddCriteriaReferencePayload }) =>
      addCriteriaReference(criteriaId, data),
    onSuccess: (_, vars) => {
      toast.success("Reference added");
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.references(vars.criteriaId) });
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteCriteriaReference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ criteriaId, refId }: { criteriaId: string; refId: string }) =>
      deleteCriteriaReference(criteriaId, refId),
    onSuccess: (res, vars) => {
      toast.success(res.message || "Reference removed");
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.references(vars.criteriaId) });
      queryClient.invalidateQueries({ queryKey: ACCEPTANCE_CRITERIA_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
