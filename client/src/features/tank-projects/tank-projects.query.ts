// src/features/tank-projects/tank-projects.query.ts
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTankProject, generateProjectProcesses, deleteTankProject } from "./tank-projects.api";
import type { CreateTankProjectPayload } from "./tank-projects.api";
import { TANK_KEYS } from "@/features/tanks/tanks.query";

export const TANK_PROJECT_KEYS = {
  all: ["tank-projects"] as const,
  detail: (id: string) => ["tank-projects", "detail", id] as const,
};

export function useCreateTankProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTankProjectPayload) => createTankProject(data),
    onSuccess: (project) => {
      toast.success("Overhaul project created. Tank is now under overhaul.");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.detail(project.tankId) });
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useGenerateProjectProcesses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => generateProjectProcesses(id),
    onSuccess: (res, id) => {
      toast.success(`${res.generated} process(es) generated.`);
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteTankProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTankProject(id),
    onSuccess: (res) => {
      toast.success(res.message || "Tank project deleted");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}
