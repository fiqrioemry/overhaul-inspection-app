-- Remove LOCKED from ProcessStatusEnum. All processes are now visible/startable as
-- NOT_STARTED; dependency gating is advisory (eligibility) rather than a hard lock.

-- 1. Migrate existing LOCKED rows to NOT_STARTED.
UPDATE "tank_processes" SET "status" = 'NOT_STARTED' WHERE "status" = 'LOCKED';

-- 2. Drop column defaults that reference the old enum.
ALTER TABLE "tank_processes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "process_dependencies" ALTER COLUMN "required_status" DROP DEFAULT;

-- 3. Recreate the enum without LOCKED and swap columns over.
ALTER TYPE "ProcessStatusEnum" RENAME TO "ProcessStatusEnum_old";
CREATE TYPE "ProcessStatusEnum" AS ENUM ('NOT_STARTED', 'WAITING_REVIEW', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED');

ALTER TABLE "tank_processes"
  ALTER COLUMN "status" TYPE "ProcessStatusEnum" USING ("status"::text::"ProcessStatusEnum");
ALTER TABLE "process_dependencies"
  ALTER COLUMN "required_status" TYPE "ProcessStatusEnum" USING ("required_status"::text::"ProcessStatusEnum");

DROP TYPE "ProcessStatusEnum_old";

-- 4. Restore defaults with the new enum.
ALTER TABLE "tank_processes" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
ALTER TABLE "process_dependencies" ALTER COLUMN "required_status" SET DEFAULT 'COMPLETED';
