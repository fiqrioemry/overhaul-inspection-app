-- Refactor: separate Tank (physical asset) from TankProject (engagement/work package).
-- Staged migration: (1) add new structures, (2) backfill, (3) enforce constraints & drop old columns.

-- ─── Phase 1: New enums ───────────────────────────────────────────────────────
CREATE TYPE "TankAssetStatusEnum" AS ENUM ('OPERATIONAL', 'UNDER_OVERHAUL', 'OUT_OF_SERVICE', 'DECOMMISSIONED');
CREATE TYPE "TankProjectTypeEnum" AS ENUM ('NEW_BUILD', 'OVERHAUL', 'REPAIR', 'ROUTINE_INSPECTION');
CREATE TYPE "TankProjectStatusEnum" AS ENUM ('PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- ─── Phase 1: tank_projects table ─────────────────────────────────────────────
CREATE TABLE "tank_projects" (
    "id" TEXT NOT NULL,
    "project_no" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "type" "TankProjectTypeEnum" NOT NULL DEFAULT 'OVERHAUL',
    "status" "TankProjectStatusEnum" NOT NULL DEFAULT 'PLANNED',
    "contractor_company_id" TEXT,
    "inspection_company_id" TEXT,
    "start_date" DATE,
    "estimated_finish_date" DATE,
    "actual_finish_date" DATE,
    "description" TEXT,
    "remarks" TEXT,
    "ai_extracted_at" TIMESTAMP(3),
    "ai_extraction_meta" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "tank_projects_pkey" PRIMARY KEY ("id")
);

-- ─── Phase 1: asset_status on tanks + nullable project_id columns ──────────────
ALTER TABLE "tanks" ADD COLUMN "asset_status" "TankAssetStatusEnum" NOT NULL DEFAULT 'OPERATIONAL';
ALTER TABLE "tank_processes" ADD COLUMN "project_id" TEXT;
ALTER TABLE "findings" ADD COLUMN "project_id" TEXT;
ALTER TABLE "inspection_requests" ADD COLUMN "project_id" TEXT;
ALTER TABLE "daily_reports" ADD COLUMN "project_id" TEXT;

-- ─── Phase 2: Backfill one TankProject per project-like tank ───────────────────
-- A tank is "project-like" if it already has processes, companies, or schedule dates.
INSERT INTO "tank_projects" (
    "id", "project_no", "tank_id", "type", "status",
    "contractor_company_id", "inspection_company_id",
    "start_date", "estimated_finish_date", "actual_finish_date",
    "created_by", "created_at", "updated_at"
)
SELECT
    'prj_' || t."id",
    'OVH-' || t."tank_no" || '-' || COALESCE(
        EXTRACT(YEAR FROM t."start_date")::int,
        EXTRACT(YEAR FROM CURRENT_DATE)::int
    )::text,
    t."id",
    'OVERHAUL'::"TankProjectTypeEnum",
    (CASE
        WHEN EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."tank_id" = t."id")
             AND NOT EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."tank_id" = t."id" AND tp."status" <> 'COMPLETED')
            THEN 'COMPLETED'
        WHEN EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."tank_id" = t."id" AND tp."status" IN ('IN_PROGRESS', 'WAITING_REVIEW', 'REVIEWED'))
            THEN 'IN_PROGRESS'
        ELSE 'PLANNED'
    END)::"TankProjectStatusEnum",
    t."contractor_company_id",
    t."inspection_company_id",
    t."start_date",
    t."estimated_finish_date",
    t."actual_finish_date",
    t."created_by",
    t."created_at",
    t."updated_at"
FROM "tanks" t
WHERE
    EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."tank_id" = t."id")
    OR t."contractor_company_id" IS NOT NULL
    OR t."inspection_company_id" IS NOT NULL
    OR t."start_date" IS NOT NULL
    OR t."estimated_finish_date" IS NOT NULL
    OR t."actual_finish_date" IS NOT NULL;

-- ─── Phase 2: Repoint tank_processes to their generated project ────────────────
UPDATE "tank_processes" tp
SET "project_id" = pr."id"
FROM "tank_projects" pr
WHERE pr."tank_id" = tp."tank_id";

-- ─── Phase 2: Repoint findings (process/project findings) ──────────────────────
UPDATE "findings" f
SET "project_id" = pr."id"
FROM "tank_projects" pr
WHERE pr."tank_id" = f."tank_id";

-- ─── Phase 2: Repoint inspection requests ──────────────────────────────────────
UPDATE "inspection_requests" ir
SET "project_id" = tp."project_id"
FROM "tank_processes" tp
WHERE ir."tank_process_id" = tp."id" AND ir."project_id" IS NULL;

UPDATE "inspection_requests" ir
SET "project_id" = pr."id"
FROM "tank_projects" pr
WHERE ir."project_id" IS NULL AND ir."tank_id" IS NOT NULL AND pr."tank_id" = ir."tank_id";

UPDATE "inspection_requests" ir
SET "tank_id" = pr."tank_id"
FROM "tank_projects" pr
WHERE ir."tank_id" IS NULL AND ir."project_id" = pr."id";

-- ─── Phase 2: Repoint daily reports (only process-bound = project progress) ────
UPDATE "daily_reports" dr
SET "project_id" = tp."project_id"
FROM "tank_processes" tp
WHERE dr."tank_process_id" = tp."id";

UPDATE "daily_reports" dr
SET "tank_id" = pr."tank_id"
FROM "tank_projects" pr
WHERE dr."tank_id" IS NULL AND dr."project_id" = pr."id";

-- ─── Phase 2: Backfill tank asset_status ───────────────────────────────────────
UPDATE "tanks" t
SET "asset_status" = (CASE
    WHEN t."status"::text = 'INACTIVE' THEN 'OUT_OF_SERVICE'
    WHEN t."status"::text = 'BANNED' THEN 'OUT_OF_SERVICE'
    WHEN EXISTS (SELECT 1 FROM "tank_projects" pr WHERE pr."tank_id" = t."id" AND pr."status" IN ('IN_PROGRESS', 'ON_HOLD')) THEN 'UNDER_OVERHAUL'
    ELSE 'OPERATIONAL'
END)::"TankAssetStatusEnum";

-- ─── Phase 3: Enforce NOT NULL on tank_processes.project_id ────────────────────
ALTER TABLE "tank_processes" ALTER COLUMN "project_id" SET NOT NULL;

-- ─── Phase 3: Drop old tank_processes.tank_id (index, FK, column, unique) ───────
DROP INDEX IF EXISTS "tank_processes_tank_id_process_template_id_key";
DROP INDEX IF EXISTS "tank_processes_tank_id_idx";
ALTER TABLE "tank_processes" DROP CONSTRAINT IF EXISTS "tank_processes_tank_id_fkey";
ALTER TABLE "tank_processes" DROP COLUMN "tank_id";

CREATE UNIQUE INDEX "tank_processes_project_id_process_template_id_key" ON "tank_processes"("project_id", "process_template_id");
CREATE INDEX "tank_processes_project_id_idx" ON "tank_processes"("project_id");

-- ─── Phase 3: Drop old project fields from tanks ───────────────────────────────
ALTER TABLE "tanks" DROP CONSTRAINT IF EXISTS "tanks_contractor_company_id_fkey";
ALTER TABLE "tanks" DROP CONSTRAINT IF EXISTS "tanks_inspection_company_id_fkey";
DROP INDEX IF EXISTS "tanks_status_idx";
ALTER TABLE "tanks" DROP COLUMN "contractor_company_id";
ALTER TABLE "tanks" DROP COLUMN "inspection_company_id";
ALTER TABLE "tanks" DROP COLUMN "start_date";
ALTER TABLE "tanks" DROP COLUMN "estimated_finish_date";
ALTER TABLE "tanks" DROP COLUMN "actual_finish_date";
ALTER TABLE "tanks" DROP COLUMN "status";
CREATE INDEX "tanks_asset_status_idx" ON "tanks"("asset_status");

-- ─── Phase 3: findings — nullable tank_process_id, SetNull FK, project FK ───────
ALTER TABLE "findings" ALTER COLUMN "tank_process_id" DROP NOT NULL;
ALTER TABLE "findings" DROP CONSTRAINT IF EXISTS "findings_tank_process_id_fkey";
ALTER TABLE "findings" ADD CONSTRAINT "findings_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "findings_project_id_idx" ON "findings"("project_id");

-- ─── Phase 3: daily_reports — tank FK to SetNull, project FK + index ───────────
ALTER TABLE "daily_reports" DROP CONSTRAINT IF EXISTS "daily_reports_tank_id_fkey";
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "daily_reports_project_id_idx" ON "daily_reports"("project_id");

-- ─── Phase 3: inspection_requests — project index ──────────────────────────────
CREATE INDEX "inspection_requests_project_id_idx" ON "inspection_requests"("project_id");

-- ─── Phase 3: tank_projects indexes + foreign keys ─────────────────────────────
CREATE UNIQUE INDEX "tank_projects_project_no_key" ON "tank_projects"("project_no");
CREATE INDEX "tank_projects_tank_id_idx" ON "tank_projects"("tank_id");
CREATE INDEX "tank_projects_type_idx" ON "tank_projects"("type");
CREATE INDEX "tank_projects_status_idx" ON "tank_projects"("status");
CREATE INDEX "tank_projects_contractor_company_id_idx" ON "tank_projects"("contractor_company_id");
CREATE INDEX "tank_projects_inspection_company_id_idx" ON "tank_projects"("inspection_company_id");
CREATE INDEX "tank_projects_deleted_at_idx" ON "tank_projects"("deleted_at");

ALTER TABLE "tank_projects" ADD CONSTRAINT "tank_projects_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tank_projects" ADD CONSTRAINT "tank_projects_contractor_company_id_fkey" FOREIGN KEY ("contractor_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tank_projects" ADD CONSTRAINT "tank_projects_inspection_company_id_fkey" FOREIGN KEY ("inspection_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tank_projects" ADD CONSTRAINT "tank_projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tank_processes" ADD CONSTRAINT "tank_processes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tank_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "findings" ADD CONSTRAINT "findings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tank_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tank_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tank_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
