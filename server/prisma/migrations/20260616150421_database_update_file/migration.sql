/*
  Warnings:

  - The values [REJECTED,NOT_APPLICABLE] on the enum `ProcessStatusEnum` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProcessStatusEnum_new" AS ENUM ('LOCKED', 'NOT_STARTED', 'WAITING_REVIEW', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED');
ALTER TABLE "public"."tank_processes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tank_processes" ALTER COLUMN "status" TYPE "ProcessStatusEnum_new" USING ("status"::text::"ProcessStatusEnum_new");
ALTER TYPE "ProcessStatusEnum" RENAME TO "ProcessStatusEnum_old";
ALTER TYPE "ProcessStatusEnum_new" RENAME TO "ProcessStatusEnum";
DROP TYPE "public"."ProcessStatusEnum_old";
ALTER TABLE "tank_processes" ALTER COLUMN "status" SET DEFAULT 'LOCKED';
COMMIT;
