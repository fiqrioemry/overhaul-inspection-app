-- Migrate existing rows with removed enum values to MONITORING before altering the enum
UPDATE "daily_reports"
SET "activity_type" = 'MONITORING'
WHERE "activity_type" IN ('FINDING', 'REPAIR', 'TEST_ACTIVITY', 'INFORMATION');

-- Remove unused enum values from DailyActivityTypeEnum
ALTER TYPE "DailyActivityTypeEnum" RENAME TO "DailyActivityTypeEnum_old";
CREATE TYPE "DailyActivityTypeEnum" AS ENUM ('MONITORING', 'INSPECTION');
ALTER TABLE "daily_reports" ALTER COLUMN "activity_type" TYPE "DailyActivityTypeEnum" USING "activity_type"::text::"DailyActivityTypeEnum";
DROP TYPE "DailyActivityTypeEnum_old";
