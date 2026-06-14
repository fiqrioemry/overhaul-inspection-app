import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TestRecordController as ctrl } from "@/modules/test-records/test-record.controller";

const testRecordsFlat = new Hono();

testRecordsFlat.get("/:id", protect, requirePermission(PERMISSIONS.TEST_RECORD_READ), ctrl.getById);
testRecordsFlat.patch("/:id", protect, requirePermission(PERMISSIONS.TEST_RECORD_UPDATE), ctrl.updateRecord);
testRecordsFlat.patch("/:id/complete", protect, requirePermission(PERMISSIONS.TEST_RECORD_COMPLETE), ctrl.completeRecord);
testRecordsFlat.delete("/:id", protect, requirePermission(PERMISSIONS.TEST_RECORD_DELETE), ctrl.deleteRecord);

export default testRecordsFlat;
