/*
  Warnings:

  - The values [REPAIRED,VERIFIED,CLOSED,REJECTED] on the enum `FindingStatusEnum` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `actual_finish_date` on the `tank_processes` table. All the data in the column will be lost.
  - You are about to drop the column `actual_start_date` on the `tank_processes` table. All the data in the column will be lost.
  - You are about to drop the column `planned_start_date` on the `tank_processes` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FindingStatusEnum_new" AS ENUM ('OPEN', 'IN_REPAIR', 'CLOSE');
ALTER TABLE "public"."findings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "findings" ALTER COLUMN "status" TYPE "FindingStatusEnum_new" USING ("status"::text::"FindingStatusEnum_new");
ALTER TYPE "FindingStatusEnum" RENAME TO "FindingStatusEnum_old";
ALTER TYPE "FindingStatusEnum_new" RENAME TO "FindingStatusEnum";
DROP TYPE "public"."FindingStatusEnum_old";
ALTER TABLE "findings" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- AlterTable
ALTER TABLE "daily_reports" ADD COLUMN     "ai_analysis_meta" JSONB,
ADD COLUMN     "ai_analyzed_at" TIMESTAMP(3),
ADD COLUMN     "ai_suggested_description" TEXT;

-- AlterTable
ALTER TABLE "tank_processes" DROP COLUMN "actual_finish_date",
DROP COLUMN "actual_start_date",
DROP COLUMN "planned_start_date",
ADD COLUMN     "finish_date" TIMESTAMP(3),
ADD COLUMN     "start_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "daily_report_attachments" (
    "id" TEXT NOT NULL,
    "daily_report_id" TEXT NOT NULL,
    "file_storage_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_report_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_report_attachments_daily_report_id_idx" ON "daily_report_attachments"("daily_report_id");

-- CreateIndex
CREATE INDEX "daily_report_attachments_file_storage_id_idx" ON "daily_report_attachments"("file_storage_id");

-- CreateIndex
CREATE INDEX "daily_report_attachments_deleted_at_idx" ON "daily_report_attachments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_report_attachments_daily_report_id_file_storage_id_key" ON "daily_report_attachments"("daily_report_id", "file_storage_id");

-- AddForeignKey
ALTER TABLE "daily_report_attachments" ADD CONSTRAINT "daily_report_attachments_daily_report_id_fkey" FOREIGN KEY ("daily_report_id") REFERENCES "daily_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report_attachments" ADD CONSTRAINT "daily_report_attachments_file_storage_id_fkey" FOREIGN KEY ("file_storage_id") REFERENCES "file_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
