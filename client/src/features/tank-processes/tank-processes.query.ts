// src/features/tank-processes/tank-processes.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTankProcesses, getTankProcessById, updateProcessStatus, updateProcessDates, completeProcessDirect, correctProcessStatus, getProcessEligibility, deleteTankProcess } from "./tank-processes.api";
import type { UpdateProcessStatusPayload, UpdateProcessDatesPayload, CorrectProcessStatusPayload } from "./tank-processes.api";

export const PROCESS_KEYS = {
  all: ["tank-processes"] as const,
  byTank: (tankId: string) => ["tank-processes", "by-tank", tankId] as const,
  detail: (id: string) => ["tank-processes", "detail", id] as const,
  eligibility: (id: string) => ["tank-processes", "eligibility", id] as const,
};

/**
 * A process-status change can complete or reopen its owning project on the server
 * (reconcileProjectStatusFromProcesses), so every mutation that moves a process refreshes the
 * project-shaped views too: the tank detail query backing the Projects tab, the tank-project
 * queries, and the dashboard's Tank Progress. Scoped key prefixes, never a blanket clear.
 */
function invalidateProcessAndProjectQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
  queryClient.invalidateQueries({ queryKey: ["tanks"] });
  queryClient.invalidateQueries({ queryKey: ["tank-projects"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

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
      invalidateProcessAndProjectQueries(queryClient);
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
      invalidateProcessAndProjectQueries(queryClient);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useCorrectProcessStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tankId, processId, data }: { tankId: string; processId: string; data: CorrectProcessStatusPayload }) => correctProcessStatus(tankId, processId, data),
    onSuccess: () => {
      toast.success("Process status updated");
      invalidateProcessAndProjectQueries(queryClient);
    },
    onError: (err: { message: string; status?: number }) => {
      toast.error(err.message);
      // 409 means the row moved on after the dialog was opened. Refetch so the list and the
      // dialog show the status the server actually holds before the operator retries.
      if (err.status === 409) queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
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
      // Removing a process can complete the project it belonged to, so this refreshes the same
      // project-shaped views as a status change.
      invalidateProcessAndProjectQueries(queryClient);
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
