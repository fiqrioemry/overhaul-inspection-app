import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { TestRecordController as ctrl } from "@/modules/test-records/test-record.controller";

const testRecords = new Hono();

// Nested under tank-processes (mounted at /tank-processes)
testRecords.post("/:tankProcessId/test-records", protect, requirePermission(PERMISSIONS.TEST_RECORD_CREATE), ctrl.createRecord);
testRecords.get("/:tankProcessId/test-records", protect, requirePermission(PERMISSIONS.TEST_RECORD_READ), ctrl.listByTankProcess);

export default testRecords;
