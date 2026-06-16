import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TankProcessController as ctrl } from "@/modules/tank-processes/tank-process.controller";

const tankProcesses = new Hono();

tankProcesses.get("/:id", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getProcessById);
tankProcesses.patch("/:id/status", protect, requirePermission(PERMISSIONS.PROCESS_UPDATE), ctrl.updateStatus);
tankProcesses.get("/:id/eligibility", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getEligibility);
tankProcesses.get("/:id/checklist", protect, requirePermission(PERMISSIONS.CHECKLIST_READ), ctrl.getChecklist);

export default tankProcesses;
