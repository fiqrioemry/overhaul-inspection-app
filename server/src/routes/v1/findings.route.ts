import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { FindingController as ctrl } from "@/modules/findings/finding.controller";

const findings = new Hono();

findings.post("/", protect, requirePermission(PERMISSIONS.FINDING_CREATE), ctrl.createFinding);
findings.get("/", protect, requirePermission(PERMISSIONS.FINDING_READ), ctrl.listFindings);
findings.get("/:id", protect, requirePermission(PERMISSIONS.FINDING_READ), ctrl.getFindingById);
findings.patch("/:id", protect, requirePermission(PERMISSIONS.FINDING_UPDATE), ctrl.updateFinding);
findings.patch("/:id/status", protect, requirePermission(PERMISSIONS.FINDING_UPDATE), ctrl.updateFindingStatus);
findings.delete("/:id", protect, requirePermission(PERMISSIONS.FINDING_DELETE), ctrl.deleteFinding);

export default findings;
