-- Data-only reconciliation: bring existing tank_projects in line with the invariant now
-- enforced on every process-status mutation (src/services/project-status.service.ts).
--
--   at least one process AND every process COMPLETED  -> COMPLETED
--   currently COMPLETED AND any process not COMPLETED -> IN_PROGRESS
--
-- No schema change. Idempotent: each statement is a conditional UPDATE whose WHERE clause stops
-- matching once the row is correct, so re-running changes nothing.
--
-- Not touched: CANCELLED projects (a deliberate operator decision), soft-deleted projects,
-- process statuses, checklist results. tank_processes has no soft-delete column, so every row
-- on a project is an active process.
--
-- The final block DOES re-derive tanks.asset_status. That field is not independent data: it is
-- defined as "has an active project -> UNDER_OVERHAUL, else OPERATIONAL"
-- (src/services/tank-asset-status.service.ts), and every project-status write in the codebase
-- recalculates it. Rewriting project statuses here without it would leave tanks reading
-- UNDER_OVERHAUL with no active project — miscounting the dashboard's "Under Overhaul" card and
-- blocking new projects, since the UI treats that status as "already has an active project".

-- ─── Complete projects whose processes are all done ───────────────────────────
UPDATE "tank_projects" pr
SET
    "status" = 'COMPLETED'::"TankProjectStatusEnum",
    -- The project's completion timestamp. Prefer the real evidence — the latest process finish
    -- date — and fall back to now() only when no process recorded one.
    "actual_finish_date" = COALESCE(
        pr."actual_finish_date",
        (SELECT MAX(tp."finish_date")::date FROM "tank_processes" tp WHERE tp."project_id" = pr."id"),
        CURRENT_DATE
    ),
    "updated_at" = NOW()
WHERE
    pr."deleted_at" IS NULL
    AND pr."status" NOT IN ('COMPLETED', 'CANCELLED')
    AND EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."project_id" = pr."id")
    AND NOT EXISTS (
        SELECT 1 FROM "tank_processes" tp
        WHERE tp."project_id" = pr."id" AND tp."status" <> 'COMPLETED'
    );

-- ─── Reopen projects marked complete that still have outstanding work ─────────
-- Includes a project whose processes were all removed: it must not stay COMPLETED, and
-- IN_PROGRESS is the honest state for an engagement that has already run.
UPDATE "tank_projects" pr
SET
    "status" = 'IN_PROGRESS'::"TankProjectStatusEnum",
    "actual_finish_date" = NULL,
    "updated_at" = NOW()
WHERE
    pr."deleted_at" IS NULL
    AND pr."status" = 'COMPLETED'
    AND (
        NOT EXISTS (SELECT 1 FROM "tank_processes" tp WHERE tp."project_id" = pr."id")
        OR EXISTS (
            SELECT 1 FROM "tank_processes" tp
            WHERE tp."project_id" = pr."id" AND tp."status" <> 'COMPLETED'
        )
    );

-- ─── Re-derive tank asset status from the corrected project statuses ──────────
-- Mirrors recalculateTankAssetStatus (src/services/tank-asset-status.service.ts): a tank with
-- an active project is UNDER_OVERHAUL, otherwise OPERATIONAL. DECOMMISSIONED is permanent and
-- never overwritten; OUT_OF_SERVICE is only left behind when no active project exists.
UPDATE "tanks" t
SET "asset_status" = 'UNDER_OVERHAUL'::"TankAssetStatusEnum", "updated_at" = NOW()
WHERE
    t."deleted_at" IS NULL
    AND t."asset_status" NOT IN ('DECOMMISSIONED', 'UNDER_OVERHAUL')
    AND EXISTS (
        SELECT 1 FROM "tank_projects" pr
        WHERE pr."tank_id" = t."id" AND pr."deleted_at" IS NULL
          AND pr."status" IN ('PLANNED', 'IN_PROGRESS', 'ON_HOLD')
    );

UPDATE "tanks" t
SET "asset_status" = 'OPERATIONAL'::"TankAssetStatusEnum", "updated_at" = NOW()
WHERE
    t."deleted_at" IS NULL
    AND t."asset_status" = 'UNDER_OVERHAUL'
    AND NOT EXISTS (
        SELECT 1 FROM "tank_projects" pr
        WHERE pr."tank_id" = t."id" AND pr."deleted_at" IS NULL
          AND pr."status" IN ('PLANNED', 'IN_PROGRESS', 'ON_HOLD')
    );
