// src/features/tank-processes/tank-processes.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTankProcesses, getTankProcessById, updateProcessStatus, getProcessEligibility } from "./tank-processes.api";
import type { UpdateProcessStatusPayload } from "./tank-processes.api";

export const PROCESS_KEYS = {
  all: ["tank-processes"] as const,
  byTank: (tankId: string) => ["tank-processes", "by-tank", tankId] as const,
  detail: (id: string) => ["tank-processes", "detail", id] as const,
  eligibility: (id: string) => ["tank-processes", "eligibility", id] as const,
};

export function useTankProcesses(tankId: string) {
  return useQuery({
    queryKey: PROCESS_KEYS.byTank(tankId),
    queryFn: () => getTankProcesses(tankId),
    enabled: Boolean(tankId),
    staleTime: 1000 * 30,
  });
}

export function useTankProcess(id: string) {
  return useQuery({
    queryKey: PROCESS_KEYS.detail(id),
    queryFn: () => getTankProcessById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useProcessEligibility(id: string) {
  return useQuery({
    queryKey: PROCESS_KEYS.eligibility(id),
    queryFn: () => getProcessEligibility(id),
    enabled: Boolean(id),
    staleTime: 1000 * 20,
  });
}

export function useUpdateProcessStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessStatusPayload }) => updateProcessStatus(id, data),
    onSuccess: () => {
      toast.success("Process status updated");
      queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
