-- Remove result column from tank_processes (no longer tracking process result separately)
DROP INDEX IF EXISTS "tank_processes_result_idx";
ALTER TABLE "tank_processes" DROP COLUMN IF EXISTS "result";

-- Replace required_result with required_status in process_dependencies
-- Add new column with default COMPLETED
ALTER TABLE "process_dependencies" ADD COLUMN "required_status" "ProcessStatusEnum" NOT NULL DEFAULT 'COMPLETED';
-- Drop old column
ALTER TABLE "process_dependencies" DROP COLUMN "required_result";
