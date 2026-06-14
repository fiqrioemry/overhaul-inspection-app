import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { RadiographyController as ctrl } from "@/modules/radiography/radiography.controller";

const radiographyJoints = new Hono();

radiographyJoints.patch("/:id", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_UPDATE), ctrl.updateJoint);
radiographyJoints.delete("/:id", protect, requirePermission(PERMISSIONS.RADIOGRAPHY_DELETE), ctrl.deleteJoint);

export default radiographyJoints;
