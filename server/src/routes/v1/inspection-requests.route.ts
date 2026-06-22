import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { InspectionRequestController as ctrl } from "@/modules/inspection-requests/inspection-request.controller";
import { TestRecordController as testCtrl } from "@/modules/test-records/test-record.controller";

const inspectionRequests = new Hono();

// Options (must be before /:id)
inspectionRequests.get("/options/tanks", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_CREATE), ctrl.listTankOptions);
inspectionRequests.get("/options/tank-processes", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_CREATE), ctrl.listTankProcessOptions);

inspectionRequests.post("/", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_CREATE), ctrl.createRequest);
inspectionRequests.get("/", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.listRequests);
inspectionRequests.get("/:id", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_READ), ctrl.getRequestById);
inspectionRequests.patch("/:id", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.updateRequest);
inspectionRequests.delete("/:id", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.deleteRequest);

inspectionRequests.post("/:id/submit-confirm", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.submitConfirm);
inspectionRequests.patch("/:id/status", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.updateStatus);
inspectionRequests.post("/:id/attachments", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.uploadAttachment);
inspectionRequests.delete("/:id/attachments/:attachmentId", protect, requirePermission(PERMISSIONS.INSPECTION_REQUEST_UPDATE), ctrl.removeAttachment);

// Test records under a request
inspectionRequests.get("/:id/test-records", protect, requirePermission(PERMISSIONS.TEST_RECORD_READ), testCtrl.listByRequest);
inspectionRequests.post("/:id/test-records", protect, requirePermission(PERMISSIONS.TEST_RECORD_CREATE), testCtrl.createByRequest);

export default inspectionRequests;
