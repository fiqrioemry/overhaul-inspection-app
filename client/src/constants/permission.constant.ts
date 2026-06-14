// src/constants/permission.constant.ts

export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",

  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  TANK_CREATE: "tank.create",
  TANK_READ: "tank.read",
  TANK_UPDATE: "tank.update",
  TANK_DELETE: "tank.delete",

  PROCESS_READ: "process.read",
  PROCESS_UPDATE: "process.update",

  DAILY_REPORT_CREATE: "daily_report.create",
  DAILY_REPORT_READ: "daily_report.read",
  DAILY_REPORT_UPDATE: "daily_report.update",
  DAILY_REPORT_DELETE: "daily_report.delete",
  DAILY_REPORT_PRINT: "daily_report.print",

  FINDING_CREATE: "finding.create",
  FINDING_READ: "finding.read",
  FINDING_UPDATE: "finding.update",
  FINDING_CLOSE: "finding.close",
  FINDING_DELETE: "finding.delete",

  CHECKLIST_READ: "checklist.read",
  CHECKLIST_UPDATE: "checklist.update",

  INSPECTION_REQUEST_CREATE: "inspection_request.create",
  INSPECTION_REQUEST_READ: "inspection_request.read",
  INSPECTION_REQUEST_REVIEW: "inspection_request.review",
  INSPECTION_REQUEST_UPDATE: "inspection_request.update",

  TEST_RECORD_CREATE: "test_record.create",
  TEST_RECORD_READ: "test_record.read",
  TEST_RECORD_UPDATE: "test_record.update",
  TEST_RECORD_COMPLETE: "test_record.complete",
  TEST_RECORD_DELETE: "test_record.delete",

  RADIOGRAPHY_CREATE: "radiography.create",
  RADIOGRAPHY_READ: "radiography.read",
  RADIOGRAPHY_UPDATE: "radiography.update",
  RADIOGRAPHY_DELETE: "radiography.delete",

  FILE_UPLOAD: "file.upload",
  FILE_READ: "file.read",

  MASTER_PROCESS_CREATE: "master_process.create",
  MASTER_PROCESS_READ: "master_process.read",
  MASTER_PROCESS_UPDATE: "master_process.update",

  ACCEPTANCE_CRITERIA_CREATE: "acceptance_criteria.create",
  ACCEPTANCE_CRITERIA_READ: "acceptance_criteria.read",
  ACCEPTANCE_CRITERIA_UPDATE: "acceptance_criteria.update",

  REFERENCE_DOCUMENT_CREATE: "reference_document.create",
  REFERENCE_DOCUMENT_READ: "reference_document.read",
  REFERENCE_DOCUMENT_UPDATE: "reference_document.update",

  COMPANY_CREATE: "company.create",
  COMPANY_READ: "company.read",
  COMPANY_UPDATE: "company.update",

  NOTIFICATION_CREATE: "notification.create",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_UPDATE: "notification.update",

  REPORT_PRINT: "report.print",
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
