import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ProcessTemplateController as ctrl } from "@/modules/process-templates/process-template.controller";

const processDependencies = new Hono();

processDependencies.patch("/:id", protect, requirePermission(PERMISSIONS.PROCESS_DEPENDENCY_UPDATE), ctrl.updateDependency);
processDependencies.delete("/:id", protect, requirePermission(PERMISSIONS.PROCESS_DEPENDENCY_DELETE), ctrl.removeDependency);

export default processDependencies;
