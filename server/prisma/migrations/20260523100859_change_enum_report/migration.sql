/*
  Warnings:

  - The values [MISINFORMATION] on the enum `PostReportReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PostReportReason_new" AS ENUM ('SPAM', 'HARASSMENT', 'NUDITY', 'VIOLENCE', 'MISSINFORMATION', 'OTHER');
ALTER TABLE "post_reports" ALTER COLUMN "reason" TYPE "PostReportReason_new" USING ("reason"::text::"PostReportReason_new");
ALTER TYPE "PostReportReason" RENAME TO "PostReportReason_old";
ALTER TYPE "PostReportReason_new" RENAME TO "PostReportReason";
DROP TYPE "public"."PostReportReason_old";
COMMIT;
