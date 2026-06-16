/*
  Warnings:

  - The values [FAILED,NOT_APPLICABLE] on the enum `ChecklistStatusEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `actual_text` on the `checklist_results` table. All the data in the column will be lost.
  - You are about to drop the column `actual_value` on the `checklist_results` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ChecklistSourceEnum" AS ENUM ('TEMPLATE', 'CUSTOM');

-- AlterEnum
BEGIN;
CREATE TYPE "ChecklistStatusEnum_new" AS ENUM ('NOT_CHECKED', 'PASSED');
ALTER TABLE "public"."checklist_results" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "checklist_results" ALTER COLUMN "status" TYPE "ChecklistStatusEnum_new" USING ("status"::text::"ChecklistStatusEnum_new");
ALTER TYPE "ChecklistStatusEnum" RENAME TO "ChecklistStatusEnum_old";
ALTER TYPE "ChecklistStatusEnum_new" RENAME TO "ChecklistStatusEnum";
DROP TYPE "public"."ChecklistStatusEnum_old";
ALTER TABLE "checklist_results" ALTER COLUMN "status" SET DEFAULT 'NOT_CHECKED';
COMMIT;

-- DropForeignKey
ALTER TABLE "checklist_results" DROP CONSTRAINT "checklist_results_criteria_id_fkey";

-- AlterTable
ALTER TABLE "checklist_results" DROP COLUMN "actual_text",
DROP COLUMN "actual_value",
ADD COLUMN     "custom_acceptance_text" TEXT,
ADD COLUMN     "custom_description" TEXT,
ADD COLUMN     "custom_method" TEXT,
ADD COLUMN     "custom_name" TEXT,
ADD COLUMN     "custom_reference_text" TEXT,
ADD COLUMN     "is_required" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sequence_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" "ChecklistSourceEnum" NOT NULL DEFAULT 'TEMPLATE',
ALTER COLUMN "criteria_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "checklist_results_source_idx" ON "checklist_results"("source");

-- AddForeignKey
ALTER TABLE "checklist_results" ADD CONSTRAINT "checklist_results_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "acceptance_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;
