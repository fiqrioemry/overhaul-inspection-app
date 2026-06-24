// src/features/tanks/tanks.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTanks, getTankById, createTank, updateTank, deleteTank, extractTankDocument } from "./tanks.api";
import type { ListTanksParams, CreateTankPayload, UpdateTankPayload } from "./tanks.api";

export const TANK_KEYS = {
  all: ["tanks"] as const,
  list: (params: ListTanksParams) => ["tanks", "list", params] as const,
  detail: (id: string) => ["tanks", "detail", id] as const,
};

export function useTanks(params: ListTanksParams) {
  return useQuery({
    queryKey: TANK_KEYS.list(params),
    queryFn: () => listTanks(params),
    staleTime: 1000 * 30,
  });
}

export function useTank(id: string) {
  return useQuery({
    queryKey: TANK_KEYS.detail(id),
    queryFn: () => getTankById(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60,
  });
}

export function useCreateTank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTankPayload) => createTank(data),
    onSuccess: () => {
      toast.success("Tank asset created. Create a tank project to start an overhaul workflow.");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useExtractTankDocument() {
  return useMutation({
    mutationFn: (files: File[]) => extractTankDocument(files),
    onError: (err: { message: string }) => {
      toast.error(err.message || "Gagal mengekstrak data dokumen");
    },
  });
}

export function useUpdateTank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTankPayload }) => updateTank(id, data),
    onSuccess: (_, { id }) => {
      toast.success("Tank updated successfully");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.detail(id) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteTank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTank(id),
    onSuccess: (res) => {
      toast.success(res.message || "Tank deleted successfully");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
