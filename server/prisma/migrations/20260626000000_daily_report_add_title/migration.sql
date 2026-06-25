-- Add required `title` to daily_reports.
-- Existing rows are backfilled with a neutral placeholder, then the default is
-- dropped so future inserts must supply a title (matches schema: required, no default).
ALTER TABLE "daily_reports" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
UPDATE "daily_reports" SET "title" = 'Laporan Kegiatan Harian' WHERE "title" = '';
ALTER TABLE "daily_reports" ALTER COLUMN "title" DROP DEFAULT;
