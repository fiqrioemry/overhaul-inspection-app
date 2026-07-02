-- Remove MATERIAL_INSPECTION, VISUAL_INSPECTION, and COATING_INSPECTION from
-- InspectionRequestTypeEnum. Any existing rows using those values are migrated to OTHER.

-- 1. Migrate existing rows off the values being removed.
UPDATE "inspection_requests"
  SET "test_type" = 'OTHER'
  WHERE "test_type" IN ('MATERIAL_INSPECTION', 'VISUAL_INSPECTION', 'COATING_INSPECTION');

-- 2. Recreate the enum without the removed values and swap the column over.
ALTER TYPE "InspectionRequestTypeEnum" RENAME TO "InspectionRequestTypeEnum_old";
CREATE TYPE "InspectionRequestTypeEnum" AS ENUM (
  'PENETRANT_TEST',
  'RADIOGRAPHY_TEST',
  'OIL_LEAK_TEST',
  'PNEUMATIC_REINFORCEMENT_TEST',
  'HYDROTEST_SHELL',
  'HYDROTEST_PIPE',
  'PNEUMATIC_BOTTOM_TEST',
  'PNEUMATIC_ROOF_TEST',
  'OTHER'
);

ALTER TABLE "inspection_requests"
  ALTER COLUMN "test_type" TYPE "InspectionRequestTypeEnum" USING ("test_type"::text::"InspectionRequestTypeEnum");

DROP TYPE "InspectionRequestTypeEnum_old";
