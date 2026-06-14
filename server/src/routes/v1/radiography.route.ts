import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { RadiographyController as ctrl } from "@/modules/radiography/radiography.controller";

const radiography = new Hono();

// Nested under tank-processes
radiography.post("/:tankProcessId/radiography-tests", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_CREATE), ctrl.createRadiography);
radiography.get("/:tankProcessId/radiography-tests", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_READ), ctrl.listByTankProcess);

export default radiography;
