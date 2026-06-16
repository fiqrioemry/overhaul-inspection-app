// src/features/checklist-results/checklist-results.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getChecklistResults, updateChecklistResult } from "./checklist-results.api";
import type { UpdateChecklistResultPayload } from "./checklist-results.api";

export const CHECKLIST_KEYS = {
  all: ["checklist-results"] as const,
  byProcess: (processId: string) => ["checklist-results", "by-process", processId] as const,
};

export function useChecklistResults(processId: string) {
  return useQuery({
    queryKey: CHECKLIST_KEYS.byProcess(processId),
    queryFn: () => getChecklistResults(processId),
    enabled: Boolean(processId),
    staleTime: 1000 * 30,
  });
}

export function useUpdateChecklistResult(processId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateChecklistResultPayload }) => updateChecklistResult(id, data),
    onSuccess: () => {
      toast.success("Checklist result updated");
      queryClient.invalidateQueries({ queryKey: CHECKLIST_KEYS.byProcess(processId) });
      queryClient.invalidateQueries({ queryKey: ["tank-processes"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
