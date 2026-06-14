import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { AcceptanceCriteriaController as ctrl } from "@/modules/acceptance-criteria/acceptance-criteria.controller";

const criteria = new Hono();

criteria.post("/", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_CREATE), ctrl.createCriteria);
criteria.get("/", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_READ), ctrl.listCriteria);
criteria.get("/:id", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_READ), ctrl.getCriteriaById);
criteria.patch("/:id", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_UPDATE), ctrl.updateCriteria);
criteria.delete("/:id", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_DELETE), ctrl.deleteCriteria);

// Nested reference document linking
criteria.post("/:id/references", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_UPDATE), ctrl.addReference);
criteria.get("/:id/references", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_READ), ctrl.listReferences);
criteria.delete("/:id/references/:referenceId", protect, requirePermission(PERMISSIONS.ACCEPTANCE_CRITERIA_UPDATE), ctrl.removeReference);

export default criteria;
