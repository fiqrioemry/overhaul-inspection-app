// src/features/findings/findings.query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listFindings,
  getFindingById,
  createFinding,
  updateFinding,
  updateFindingStatus,
  deleteFinding,
  bulkCloseFindings,
} from "./findings.api";
import type { ListFindingsParams, CreateFindingPayload, UpdateFindingPayload, UpdateFindingStatusPayload, BulkCloseFindingsPayload } from "./findings.api";

export const FINDING_KEYS = {
  all: ["findings"] as const,
  list: (params: ListFindingsParams) => ["findings", "list", params] as const,
  detail: (id: string) => ["findings", "detail", id] as const,
};

export function useFindings(params: ListFindingsParams) {
  return useQuery({
    queryKey: FINDING_KEYS.list(params),
    queryFn: () => listFindings(params),
  });
}

export function useFinding(id: string) {
  return useQuery({
    queryKey: FINDING_KEYS.detail(id),
    queryFn: () => getFindingById(id),
    enabled: Boolean(id),
  });
}

export function useCreateFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFindingPayload) => createFinding(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDING_KEYS.all });
      toast.success("Finding created successfully");
    },
    onError: () => {
      toast.error("Failed to create finding");
    },
  });
}

export function useUpdateFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFindingPayload }) => updateFinding(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: FINDING_KEYS.all });
      qc.invalidateQueries({ queryKey: FINDING_KEYS.detail(id) });
      toast.success("Finding updated successfully");
    },
    onError: () => {
      toast.error("Failed to update finding");
    },
  });
}

export function useUpdateFindingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFindingStatusPayload }) => updateFindingStatus(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: FINDING_KEYS.all });
      qc.invalidateQueries({ queryKey: FINDING_KEYS.detail(id) });
      toast.success("Finding status updated");
    },
    onError: () => {
      toast.error("Failed to update finding status");
    },
  });
}

export function useDeleteFinding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFinding(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINDING_KEYS.all });
      toast.success("Finding deleted");
    },
    onError: () => {
      toast.error("Failed to delete finding");
    },
  });
}

export function useBulkCloseFindings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCloseFindingsPayload) => bulkCloseFindings(data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: FINDING_KEYS.all });
      toast.success(`${result.closed} finding(s) closed${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`);
    },
    onError: () => {
      toast.error("Failed to close findings");
    },
  });
}
