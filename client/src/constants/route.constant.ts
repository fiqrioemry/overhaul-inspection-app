// src/constants/route.constant.ts

export const ROUTES = {
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  UNAUTHORIZED: "/403",
  NOT_FOUND: "/404",

  DASHBOARD: "/",
  TANKS: "/tanks",
  TANK_DETAIL: "/tanks/:tankId",
  PROCESS_DETAIL: "/tanks/:tankId/processes/:processId",
  FINDINGS: "/findings",
  DAILY_REPORTS: "/daily-reports",
  INSPECTION_REQUESTS: "/inspection-requests",
  NOTIFICATIONS: "/notifications",
  USERS: "/users",

  MASTER_DATA: "/master-data",
  MASTER_PROCESS: "/master-data/processes",
  MASTER_CRITERIA: "/master-data/criteria",
  MASTER_REFERENCE_DOCS: "/master-data/reference-documents",
  MASTER_COMPANIES: "/master-data/companies",
} as const;
