// src/constants/process.constant.ts
import type { ProcessStatus } from "@/features/tank-processes/tank-processes.api";

// The five workflow statuses in their normal sequence. Mirrors ProcessStatusEnum in
// server/prisma/schema.prisma — no other status is part of the tank-process workflow.
export const PROCESS_STATUS_ORDER: ProcessStatus[] = ["NOT_STARTED", "IN_PROGRESS", "WAITING_REVIEW", "REVIEWED", "COMPLETED"];

export const PROCESS_STATUS_LABEL: Record<ProcessStatus, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  WAITING_REVIEW: "Waiting Review",
  REVIEWED: "Reviewed",
  COMPLETED: "Completed",
};

export const PROCESS_STATUS_OPTIONS = PROCESS_STATUS_ORDER.map((value) => ({ label: PROCESS_STATUS_LABEL[value], value }));
