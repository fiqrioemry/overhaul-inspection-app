-- Refactor InspectionRequest into a digital inspection/test request form and
-- remove the standalone radiography flow. Dev database: drop & replace, no data backfill.

-- 1. Remove radiography-specific tables and enum (replaced by the universal flow)
DROP TABLE IF EXISTS "radiography_joint_results" CASCADE;
DROP TABLE IF EXISTS "radiography_tests" CASCADE;
DROP TYPE IF EXISTS "RadiographyJointResultEnum";

-- 2. Clear request/result data before structural + enum changes (dev reset)
TRUNCATE TABLE "test_records", "inspection_requests" RESTART IDENTITY CASCADE;

-- 3. New enums
CREATE TYPE "InspectionRequestTypeEnum" AS ENUM ('PENETRANT_TEST', 'RADIOGRAPHY_TEST', 'OIL_LEAK_TEST', 'PNEUMATIC_REINFORCEMENT_TEST', 'HYDROTEST_SHELL', 'HYDROTEST_PIPE', 'PNEUMATIC_BOTTOM_TEST', 'PNEUMATIC_ROOF_TEST', 'MATERIAL_INSPECTION', 'VISUAL_INSPECTION', 'COATING_INSPECTION', 'OTHER');
CREATE TYPE "InspectionObjectTypeEnum" AS ENUM ('MANHOLE', 'COD', 'NOZZLE', 'SHELL_PLATE', 'BOTTOM_PLATE', 'ROOF_PLATE', 'REINFORCEMENT_PAD', 'PIPE', 'STEAM_COIL', 'WELD_JOINT', 'ANNULAR_PLATE', 'FLOOR_PLATE', 'VALVE', 'FLANGE', 'FITTING', 'MATERIAL', 'OTHER');
CREATE TYPE "InspectionRequestAttachmentTypeEnum" AS ENUM ('SUPPORTING_DOCUMENT', 'GENERATED_REQUEST_FORM', 'SIGNED_REQUEST_FORM', 'SKETCH', 'OTHER');
CREATE TYPE "TestResultStatusEnum" AS ENUM ('NOT_STARTED', 'REPAIR', 'PASSED');

-- 4. Swap InspectionRequestStatusEnum values
ALTER TABLE "inspection_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "InspectionRequestStatusEnum" RENAME TO "InspectionRequestStatusEnum_old";
CREATE TYPE "InspectionRequestStatusEnum" AS ENUM ('NOT_STARTED', 'IN_PROCESS', 'REPAIR', 'PASSED');
ALTER TABLE "inspection_requests" ALTER COLUMN "status" TYPE "InspectionRequestStatusEnum" USING ("status"::text::"InspectionRequestStatusEnum");
ALTER TABLE "inspection_requests" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
DROP TYPE "InspectionRequestStatusEnum_old";

-- 5. Rebuild inspection_requests columns
ALTER TABLE "inspection_requests" DROP CONSTRAINT IF EXISTS "inspection_requests_reviewed_by_fkey";
ALTER TABLE "inspection_requests" DROP CONSTRAINT IF EXISTS "inspection_requests_tank_process_id_fkey";

ALTER TABLE "inspection_requests"
  DROP COLUMN IF EXISTS "reviewed_by",
  DROP COLUMN IF EXISTS "review_notes",
  DROP COLUMN IF EXISTS "requested_at",
  DROP COLUMN IF EXISTS "reviewed_at",
  DROP COLUMN IF EXISTS "notes";

ALTER TABLE "inspection_requests" ALTER COLUMN "tank_process_id" DROP NOT NULL;

ALTER TABLE "inspection_requests"
  ADD COLUMN "tank_id" TEXT,
  ADD COLUMN "test_type" "InspectionRequestTypeEnum" NOT NULL,
  ADD COLUMN "request_date" DATE NOT NULL,
  ADD COLUMN "asset_holder" TEXT,
  ADD COLUMN "execution_party" TEXT,
  ADD COLUMN "standard_and_code" TEXT,
  ADD COLUMN "request_location" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "remarks" TEXT,
  ADD COLUMN "confirmed_at" TIMESTAMP(3),
  ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "inspection_requests_tank_id_idx" ON "inspection_requests"("tank_id");
CREATE INDEX "inspection_requests_test_type_idx" ON "inspection_requests"("test_type");
CREATE INDEX "inspection_requests_deleted_at_idx" ON "inspection_requests"("deleted_at");

ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. inspection_request_items
CREATE TABLE "inspection_request_items" (
    "id" TEXT NOT NULL,
    "inspection_request_id" TEXT NOT NULL,
    "object_type" "InspectionObjectTypeEnum" NOT NULL,
    "object_name" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "location_detail" TEXT,
    "remarks" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inspection_request_items_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inspection_request_items_inspection_request_id_idx" ON "inspection_request_items"("inspection_request_id");
ALTER TABLE "inspection_request_items" ADD CONSTRAINT "inspection_request_items_inspection_request_id_fkey" FOREIGN KEY ("inspection_request_id") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. inspection_request_attachments
CREATE TABLE "inspection_request_attachments" (
    "id" TEXT NOT NULL,
    "inspection_request_id" TEXT NOT NULL,
    "file_storage_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "attachment_type" "InspectionRequestAttachmentTypeEnum" NOT NULL DEFAULT 'SUPPORTING_DOCUMENT',
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "inspection_request_attachments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "inspection_request_attachments_inspection_request_id_file_st_key" ON "inspection_request_attachments"("inspection_request_id", "file_storage_id");
CREATE INDEX "inspection_request_attachments_inspection_request_id_idx" ON "inspection_request_attachments"("inspection_request_id");
CREATE INDEX "inspection_request_attachments_file_storage_id_idx" ON "inspection_request_attachments"("file_storage_id");
CREATE INDEX "inspection_request_attachments_attachment_type_idx" ON "inspection_request_attachments"("attachment_type");
CREATE INDEX "inspection_request_attachments_deleted_at_idx" ON "inspection_request_attachments"("deleted_at");
ALTER TABLE "inspection_request_attachments" ADD CONSTRAINT "inspection_request_attachments_inspection_request_id_fkey" FOREIGN KEY ("inspection_request_id") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_request_attachments" ADD CONSTRAINT "inspection_request_attachments_file_storage_id_fkey" FOREIGN KEY ("file_storage_id") REFERENCES "file_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. test_records: link to inspection request + result status
ALTER TABLE "test_records" DROP CONSTRAINT IF EXISTS "test_records_tank_process_id_fkey";
ALTER TABLE "test_records" ALTER COLUMN "tank_process_id" DROP NOT NULL;
ALTER TABLE "test_records"
  ADD COLUMN "inspection_request_id" TEXT NOT NULL,
  ADD COLUMN "inspection_request_item_id" TEXT,
  ADD COLUMN "status" "TestResultStatusEnum" NOT NULL DEFAULT 'NOT_STARTED';
CREATE INDEX "test_records_inspection_request_id_idx" ON "test_records"("inspection_request_id");
CREATE INDEX "test_records_inspection_request_item_id_idx" ON "test_records"("inspection_request_item_id");
CREATE INDEX "test_records_status_idx" ON "test_records"("status");
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_inspection_request_id_fkey" FOREIGN KEY ("inspection_request_id") REFERENCES "inspection_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_inspection_request_item_id_fkey" FOREIGN KEY ("inspection_request_item_id") REFERENCES "inspection_request_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. test_record_attachments
CREATE TABLE "test_record_attachments" (
    "id" TEXT NOT NULL,
    "test_record_id" TEXT NOT NULL,
    "file_storage_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "test_record_attachments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "test_record_attachments_test_record_id_file_storage_id_key" ON "test_record_attachments"("test_record_id", "file_storage_id");
CREATE INDEX "test_record_attachments_test_record_id_idx" ON "test_record_attachments"("test_record_id");
CREATE INDEX "test_record_attachments_file_storage_id_idx" ON "test_record_attachments"("file_storage_id");
CREATE INDEX "test_record_attachments_deleted_at_idx" ON "test_record_attachments"("deleted_at");
ALTER TABLE "test_record_attachments" ADD CONSTRAINT "test_record_attachments_test_record_id_fkey" FOREIGN KEY ("test_record_id") REFERENCES "test_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "test_record_attachments" ADD CONSTRAINT "test_record_attachments_file_storage_id_fkey" FOREIGN KEY ("file_storage_id") REFERENCES "file_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
