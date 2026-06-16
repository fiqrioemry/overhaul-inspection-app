// src/features/checklist-results/checklist-results.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChecklistResults,
  checkChecklist,
  bulkCheckChecklists,
  resetChecklist,
  addCustomChecklist,
} from "./checklist-results.api";
import type { CheckChecklistPayload, BulkCheckPayload, AddCustomChecklistPayload } from "./checklist-results.api";

export const CHECKLIST_KEYS = {
  all: ["checklist-results"] as const,
  byProcess: (processId: string) => ["checklist-results", "by-process", processId] as const,
};

function invalidateChecklist(queryClient: ReturnType<typeof useQueryClient>, processId: string) {
  queryClient.invalidateQueries({ queryKey: CHECKLIST_KEYS.byProcess(processId) });
  queryClient.invalidateQueries({ queryKey: ["tank-processes"] });
}

export function useChecklistResults(processId: string) {
  return useQuery({
    queryKey: CHECKLIST_KEYS.byProcess(processId),
    queryFn: () => getChecklistResults(processId),
    enabled: Boolean(processId),
    staleTime: 1000 * 30,
  });
}

export function useCheckChecklist(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, data }: { checklistId: string; data: CheckChecklistPayload }) =>
      checkChecklist(processId, checklistId, data),
    onSuccess: () => {
      toast.success("Checklist item marked as passed");
      invalidateChecklist(queryClient, processId);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
}

export function useBulkCheckChecklists(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkCheckPayload) => bulkCheckChecklists(processId, data),
    onSuccess: (_, vars) => {
      toast.success(`${vars.checklistIds.length} item(s) marked as passed`);
      invalidateChecklist(queryClient, processId);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
}

export function useResetChecklist(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checklistId: string) => resetChecklist(processId, checklistId),
    onSuccess: () => {
      toast.success("Checklist item reset");
      invalidateChecklist(queryClient, processId);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
}

export function useAddCustomChecklist(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCustomChecklistPayload) => addCustomChecklist(processId, data),
    onSuccess: () => {
      toast.success("Custom checklist item added");
      invalidateChecklist(queryClient, processId);
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });
}
