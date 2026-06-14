import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { RadiographyController as ctrl } from "@/modules/radiography/radiography.controller";

const radiographyFlat = new Hono();

// Flat radiography test routes
radiographyFlat.get("/:id", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_READ), ctrl.getById);
radiographyFlat.patch("/:id", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_UPDATE), ctrl.updateRadiography);
radiographyFlat.delete("/:id", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_DELETE), ctrl.deleteRadiography);

// Joint results nested under radiography test
radiographyFlat.post("/:radiographyTestId/joints", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_UPDATE), ctrl.addJoint);
radiographyFlat.get("/:radiographyTestId/joints", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_READ), ctrl.listJoints);

export default radiographyFlat;
