import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ProcessTemplateController as ctrl } from "@/modules/process-templates/process-template.controller";

const processTemplateCriteria = new Hono();

processTemplateCriteria.patch("/:id", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_UPDATE), ctrl.updateCriteriaMapping);
processTemplateCriteria.delete("/:id", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_UPDATE), ctrl.removeCriteriaMapping);

export default processTemplateCriteria;
