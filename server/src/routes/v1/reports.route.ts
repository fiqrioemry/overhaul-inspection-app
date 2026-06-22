import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ReportController as ctrl } from "@/modules/reports/report.controller";

const reports = new Hono();

reports.get("/daily-reports/:id/print-data", protect, requirePermission(PERMISSIONS.REPORT_PRINT), ctrl.getDailyReportPrintData);
reports.get("/tanks/:tankId/daily-reports/print-data", protect, requirePermission(PERMISSIONS.REPORT_PRINT), ctrl.getDailyReportsByDatePrintData);
reports.get("/inspection-requests/:id/print-data", protect, requirePermission(PERMISSIONS.REPORT_PRINT), ctrl.getInspectionRequestPrintData);
reports.get("/test-records/:id/print-data", protect, requirePermission(PERMISSIONS.REPORT_PRINT), ctrl.getTestRecordPrintData);

export default reports;
