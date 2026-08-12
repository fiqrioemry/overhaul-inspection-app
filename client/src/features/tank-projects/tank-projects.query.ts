// src/features/tank-projects/tank-projects.query.ts
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTankProject, updateTankProject, generateProjectProcesses, deleteTankProject, getAvailableProcessTemplates } from "./tank-projects.api";
import type { CreateTankProjectPayload, UpdateTankProjectPayload } from "./tank-projects.api";
import { TANK_KEYS } from "@/features/tanks/tanks.query";
import { PROCESS_KEYS } from "@/features/tank-processes/tank-processes.query";

export const TANK_PROJECT_KEYS = {
  all: ["tank-projects"] as const,
  detail: (id: string) => ["tank-projects", "detail", id] as const,
  availableTemplates: (id: string) => ["tank-projects", "detail", id, "available-templates"] as const,
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

export function useUpdateTankProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTankProjectPayload }) => updateTankProject(id, data),
    onSuccess: (project) => {
      toast.success("Overhaul project updated.");
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.detail(project.tankId) });
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.detail(project.id) });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useGenerateProjectProcesses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, processTemplateIds }: { id: string; processTemplateIds?: string[] }) => generateProjectProcesses(id, processTemplateIds),
    onSuccess: (res, { id }) => {
      toast.success(res.generated > 0 ? `${res.generated} process(es) added.` : "No new process was added — it may already be in the project.");
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: TANK_PROJECT_KEYS.availableTemplates(id) });
      queryClient.invalidateQueries({ queryKey: TANK_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROCESS_KEYS.all });
    },
    onError: (err: { message: string }) => {
      toast.error(err.message);
    },
  });
}

export function useAvailableProcessTemplates(projectId?: string | null) {
  return useQuery({
    queryKey: TANK_PROJECT_KEYS.availableTemplates(projectId ?? ""),
    queryFn: () => getAvailableProcessTemplates(projectId!),
    enabled: Boolean(projectId),
    staleTime: 1000 * 10,
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
