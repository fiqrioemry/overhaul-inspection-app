import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ProcessTemplateController as ctrl } from "@/modules/process-templates/process-template.controller";

const processTemplates = new Hono();

// Main CRUD
processTemplates.post("/", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_CREATE), ctrl.createTemplate);
processTemplates.get("/", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_READ), ctrl.listTemplates);
processTemplates.get("/:id", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_READ), ctrl.getTemplateById);
processTemplates.patch("/:id", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_UPDATE), ctrl.updateTemplate);
processTemplates.delete("/:id", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_DELETE), ctrl.deleteTemplate);

// Nested criteria mapping
processTemplates.post("/:id/criteria", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_UPDATE), ctrl.addCriteria);
processTemplates.get("/:id/criteria", protect, requirePermission(PERMISSIONS.MASTER_PROCESS_READ), ctrl.listCriteria);

// Nested dependency mapping
processTemplates.post("/:id/dependencies", protect, requirePermission(PERMISSIONS.PROCESS_DEPENDENCY_CREATE), ctrl.addDependency);
processTemplates.get("/:id/dependencies", protect, requirePermission(PERMISSIONS.PROCESS_DEPENDENCY_READ), ctrl.listDependencies);

export default processTemplates;
