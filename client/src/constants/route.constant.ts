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
  TANK_CREATE: "/tanks/create",
  TANK_DETAIL: "/tanks/:tankId",
  TANK_EDIT: "/tanks/:tankId/edit",
  PROCESS_DETAIL: "/tanks/:tankId/processes/:processId",

  FINDINGS: "/findings",
  DAILY_REPORTS: "/daily-reports",
  DAILY_REPORT_LIST_PRINT: "/daily-reports/print",
  DAILY_REPORT_DETAIL: "/daily-reports/:id",
  DAILY_REPORT_EDIT: "/daily-reports/:id/edit",
  TEST_RECORDS: "/test-records",
  RADIOGRAPHY: "/radiography",

  INSPECTION_REQUESTS: "/inspection-requests",
  INSPECTION_REQUEST_DETAIL: "/inspection-requests/:requestId",
  NOTIFICATIONS: "/notifications",
  USERS: "/users",

  MASTER_DATA: "/master-data",
  MASTER_PROCESS: "/master-data/processes",
  PROCESS_TEMPLATE_DETAIL: "/master-data/processes/:id",
  MASTER_CRITERIA: "/master-data/criteria",
  MASTER_REFERENCE_DOCS: "/master-data/reference-documents",
  MASTER_COMPANIES: "/master-data/companies",
} as const;
