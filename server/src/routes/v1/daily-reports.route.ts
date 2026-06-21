import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { DailyReportController as ctrl } from "@/modules/daily-reports/daily-report.controller";

const dailyReports = new Hono();

dailyReports.post("/ai/generate", protect, requirePermission(PERMISSIONS.DAILY_REPORT_CREATE), ctrl.generateAI);
dailyReports.get("/options/tanks", protect, requirePermission(PERMISSIONS.DAILY_REPORT_CREATE), ctrl.listTankOptions);
dailyReports.get("/options/tank-processes", protect, requirePermission(PERMISSIONS.DAILY_REPORT_CREATE), ctrl.listTankProcessOptions);
dailyReports.post("/", protect, requirePermission(PERMISSIONS.DAILY_REPORT_CREATE), ctrl.createReport);
dailyReports.get("/", protect, requirePermission(PERMISSIONS.DAILY_REPORT_READ), ctrl.listReports);
dailyReports.get("/:id", protect, requirePermission(PERMISSIONS.DAILY_REPORT_READ), ctrl.getReportById);
dailyReports.patch("/:id", protect, requirePermission(PERMISSIONS.DAILY_REPORT_UPDATE), ctrl.updateReport);
dailyReports.delete("/:id", protect, requirePermission(PERMISSIONS.DAILY_REPORT_DELETE), ctrl.deleteReport);

export default dailyReports;
