-- Drop old logo_url column
ALTER TABLE "companies" DROP COLUMN IF EXISTS "logo_url";

-- Add logo_file_storage_id with FK to file_storages
ALTER TABLE "companies" ADD COLUMN "logo_file_storage_id" TEXT;
ALTER TABLE "companies" ADD CONSTRAINT "companies_logo_file_storage_id_fkey"
  FOREIGN KEY ("logo_file_storage_id") REFERENCES "file_storages"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX "companies_logo_file_storage_id_key" ON "companies"("logo_file_storage_id");
