import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TankProcessController as ctrl } from "@/modules/tank-processes/tank-process.controller";
import { ChecklistResultController as checklistCtrl } from "@/modules/checklist-results/checklist-result.controller";

const tankProcesses = new Hono();

tankProcesses.get("/:id", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getProcessById);
tankProcesses.patch("/:id/status", protect, requirePermission(PERMISSIONS.PROCESS_UPDATE), ctrl.updateStatus);
tankProcesses.get("/:id/eligibility", protect, requirePermission(PERMISSIONS.PROCESS_READ), ctrl.getEligibility);
tankProcesses.get("/:id/checklist", protect, requirePermission(PERMISSIONS.CHECKLIST_READ), ctrl.getChecklist);

// Checklist actions — bulk-check must be before /:checklistId to avoid param match
tankProcesses.patch("/:id/checklists/bulk-check", protect, requirePermission(PERMISSIONS.CHECKLIST_UPDATE), checklistCtrl.bulkCheck);
tankProcesses.post("/:id/checklists/custom", protect, requirePermission(PERMISSIONS.CHECKLIST_UPDATE), checklistCtrl.addCustom);
tankProcesses.patch("/:id/checklists/:checklistId/check", protect, requirePermission(PERMISSIONS.CHECKLIST_UPDATE), checklistCtrl.checkOne);
tankProcesses.patch("/:id/checklists/:checklistId/reset", protect, requirePermission(PERMISSIONS.CHECKLIST_UPDATE), checklistCtrl.resetOne);

export default tankProcesses;
