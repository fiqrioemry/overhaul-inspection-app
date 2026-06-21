-- Make tank_id optional so a daily report can be a general activity record
-- not tied to a specific tank or tank process.
ALTER TABLE "daily_reports" ALTER COLUMN "tank_id" DROP NOT NULL;
