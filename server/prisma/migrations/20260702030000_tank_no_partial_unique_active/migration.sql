-- Make tank_no unique only among ACTIVE tanks (deleted_at IS NULL).
--
-- Previously "tanks_tank_no_key" was a plain UNIQUE index that also counted soft-deleted
-- rows, so reusing the tank_no of a soft-deleted tank (create, or edit into it) failed at
-- the database level even though the application check ignored soft-deleted rows.
--
-- Replace it with a partial unique index scoped to non-deleted rows. This keeps soft-delete
-- intact (rows are retained, deleted_at is set) and frees the number for active reuse.
--
-- Idempotent: safe to re-run. Prisma cannot represent partial unique indexes in the schema,
-- so this index is managed here by raw SQL only.

-- Drop the old, unscoped unique index/constraint (name is Prisma's default for @unique).
DROP INDEX IF EXISTS "tanks_tank_no_key";

-- Enforce uniqueness only for active tanks.
CREATE UNIQUE INDEX IF NOT EXISTS "tanks_tank_no_active_unique"
  ON "tanks" ("tank_no")
  WHERE "deleted_at" IS NULL;
