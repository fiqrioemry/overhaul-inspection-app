import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { DashboardController as ctrl } from "@/modules/dashboard/dashboard.controller";

const dashboard = new Hono();

dashboard.get("/summary", protect, requirePermission(PERMISSIONS.DASHBOARD_READ), ctrl.getSummary);
dashboard.get("/tank-progress", protect, requirePermission(PERMISSIONS.DASHBOARD_READ), ctrl.getTankProgress);
dashboard.get("/findings", protect, requirePermission(PERMISSIONS.DASHBOARD_READ), ctrl.getFindings);
dashboard.get("/tests", protect, requirePermission(PERMISSIONS.DASHBOARD_READ), ctrl.getTests);
dashboard.get("/daily-activities", protect, requirePermission(PERMISSIONS.DASHBOARD_READ), ctrl.getDailyActivities);

export default dashboard;
