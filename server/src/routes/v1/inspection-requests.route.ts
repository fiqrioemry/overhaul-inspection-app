import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { InspectionRequestController as ctrl } from "@/modules/inspection-requests/inspection-request.controller";

const inspectionRequests = new Hono();

inspectionRequests.post("/", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_CREATE), ctrl.createRequest);
inspectionRequests.get("/", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.listRequests);
inspectionRequests.get("/:id", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.getRequestById);
inspectionRequests.patch("/:id/cancel", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.cancelRequest);
inspectionRequests.patch("/:id/review", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_REVIEW), ctrl.reviewRequest);

export default inspectionRequests;
