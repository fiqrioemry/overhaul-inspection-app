// src/features/dashboard/dashboard.api.ts
import api from "@/lib/axios";
import type { ResponseSuccess } from "@/types/response.type";

export interface DashboardSummary {
  tanks: {
    total: number;
    active: number;
    inProgress: number;
  };
  processes: {
    total: number;
    completed: number;
  };
  findings: {
    open: number;
    critical: number;
  };
  inspectionRequests: {
    pending: number;
  };
}

// A row is an active TankProject; the physical tank is nested under `tank`.
// `id` is the project id — navigate to tank detail with `tank.id`, not `id`.
export interface TankProgressRow {
  id: string;
  projectNo: string;
  type: string;
  status: string;
  startDate: string | null;
  estimatedFinishDate: string | null;
  createdAt: string;
  progress: number;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  contractorCompany: { id: string; name: string } | null;
  inspectionCompany: { id: string; name: string } | null;
  processes: Array<{
    id: string;
    name: string;
    type: string;
    sequenceOrder: number;
    status: string;
  }>;
  _count: { findings: number };
}

export interface FindingSummaryData {
  byStatus: Array<{ status: string; count: number }>;
  bySeverity: Array<{ severity: string; count: number }>;
  recent: Array<{
    id: string;
    findingNo: string;
    title: string;
    status: string;
    severity: string;
    createdAt: string;
    tank: { id: string; tankNo: string };
    tankProcess: { id: string; name: string };
  }>;
}

export interface DailyActivityItem {
  id: string;
  title: string;
  activityType: "MONITORING" | "INSPECTION" | string;
  reportDate: string;
  createdAt: string;
  attachmentCount: number;
  tank: { id: string; tankNo: string; tankName: string | null } | null;
  tankProcess: { id: string; name: string } | null;
  inspector: { id: string; name: string } | null;
}

export interface DailyActivitySummary {
  date: string;
  total: number;
  items: DailyActivityItem[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<ResponseSuccess<DashboardSummary>>("/dashboard/summary");
  return res.data.data!;
}

export async function getTankProgress(): Promise<TankProgressRow[]> {
  const res = await api.get<ResponseSuccess<TankProgressRow[]>>("/dashboard/tank-progress");
  return res.data.data!;
}

export async function getDashboardFindings(): Promise<FindingSummaryData> {
  const res = await api.get<ResponseSuccess<FindingSummaryData>>("/dashboard/findings");
  return res.data.data!;
}

export async function getDashboardDailyActivities(): Promise<DailyActivitySummary> {
  const res = await api.get<ResponseSuccess<DailyActivitySummary>>("/dashboard/daily-activities");
  return res.data.data!;
}
