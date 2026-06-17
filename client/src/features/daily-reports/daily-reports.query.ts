// src/features/daily-reports/daily-reports.query.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listDailyReports, getDailyReportById, createDailyReport, updateDailyReport, deleteDailyReport, generateAIDailyReport } from "./daily-reports.api";
import type { ListDailyReportsParams, CreateDailyReportPayload, UpdateDailyReportPayload, AIGeneratePayload } from "./daily-reports.api";

export const DAILY_REPORT_KEYS = {
  all: ["daily-reports"] as const,
  list: (params: ListDailyReportsParams) => ["daily-reports", "list", params] as const,
  detail: (id: string) => ["daily-reports", "detail", id] as const,
};

export function useDailyReports(params: ListDailyReportsParams) {
  return useQuery({
    queryKey: DAILY_REPORT_KEYS.list(params),
    queryFn: () => listDailyReports(params),
  });
}

export function useDailyReport(id: string) {
  return useQuery({
    queryKey: DAILY_REPORT_KEYS.detail(id),
    queryFn: () => getDailyReportById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyReportPayload) => createDailyReport(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.all });
      toast.success("Daily report created successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to create daily report");
    },
  });
}

export function useUpdateDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDailyReportPayload }) => updateDailyReport(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.all });
      qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.detail(id) });
      toast.success("Daily report updated successfully");
    },
    onError: (err: { message: string }) => {
      toast.error(err.message || "Failed to update daily report");
    },
  });
}

export function useDeleteDailyReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDailyReport(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DAILY_REPORT_KEYS.all });
      toast.success("Daily report deleted");
    },
    onError: () => {
      toast.error("Failed to delete daily report");
    },
  });
}

export function useGenerateAIDailyReport() {
  return useMutation({
    mutationFn: (payload: AIGeneratePayload) => generateAIDailyReport(payload),
    onError: (err: { message: string }) => {
      toast.error(err.message || "Gagal generate konten AI");
    },
  });
}
