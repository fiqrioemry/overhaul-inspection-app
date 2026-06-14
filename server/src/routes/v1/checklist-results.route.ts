import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ChecklistResultController as ctrl } from "@/modules/checklist-results/checklist-result.controller";

const checklistResults = new Hono();

checklistResults.patch("/:id", protect, requirePermission(PERMISSIONS.CHECKLIST_UPDATE), ctrl.updateChecklistResult);

export default checklistResults;
