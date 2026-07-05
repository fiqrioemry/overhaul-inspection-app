import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { InspectionFormTemplateController as ctrl } from "@/modules/inspection-form-templates/inspection-form-template.controller";

const inspectionFormTemplates = new Hono();

inspectionFormTemplates.get("/", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.listTemplates);
inspectionFormTemplates.get("/by-test-type/:testType", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.getActiveByTestType);
inspectionFormTemplates.get("/:id", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.getTemplateById);

export default inspectionFormTemplates;
