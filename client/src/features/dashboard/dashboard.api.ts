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

export interface TankProgressRow {
  id: string;
  tankNo: string;
  tankName: string | null;
  status: string;
  progress: number;
  contractorCompany: { id: string; name: string } | null;
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
