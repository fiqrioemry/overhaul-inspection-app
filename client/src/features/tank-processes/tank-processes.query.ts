// src/features/tank-processes/tank-processes.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTankProcesses, getTankProcessById, updateProcessStatus, updateProcessDates, completeProcessDirect, getProcessEligibility, deleteTankProcess } from "./tank-processes.api";
import type { UpdateProcessStatusPayload, UpdateProcessDatesPayload } from "./tank-processes.api";

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

export function useCompleteProcessDirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => completeProcessDirect(id),
    onSuccess: () => {
      toast.success("Process marked as completed");
      queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateProcessDates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProcessDatesPayload }) => updateProcessDates(id, data),
    onSuccess: () => {
      toast.success("Process dates updated");
      queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteTankProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTankProcess(id),
    onSuccess: (res) => {
      toast.success(res.message || "Process removed from project");
      queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["tanks"] });
      queryClient.invalidateQueries({ queryKey: ["tank-projects"] });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
