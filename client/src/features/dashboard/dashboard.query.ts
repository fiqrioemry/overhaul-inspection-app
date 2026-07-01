// src/features/dashboard/dashboard.query.ts
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getTankProgress, getDashboardFindings, getDashboardDailyActivities, getDashboardInspectionRequests } from "./dashboard.api";

export const DASHBOARD_KEYS = {
  summary: ["dashboard", "summary"] as const,
  tankProgress: ["dashboard", "tank-progress"] as const,
  findings: ["dashboard", "findings"] as const,
  dailyActivities: ["dashboard", "daily-activities"] as const,
  inspectionRequests: ["dashboard", "inspection-requests"] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary,
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60,
  });
}

export function useTankProgress() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.tankProgress,
    queryFn: getTankProgress,
    staleTime: 1000 * 60,
  });
}

export function useDashboardFindings() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.findings,
    queryFn: getDashboardFindings,
    staleTime: 1000 * 60,
  });
}

export function useDashboardDailyActivities() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.dailyActivities,
    queryFn: getDashboardDailyActivities,
    staleTime: 1000 * 60,
  });
}

export function useDashboardInspectionRequests() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.inspectionRequests,
    queryFn: getDashboardInspectionRequests,
    staleTime: 1000 * 60,
  });
}
