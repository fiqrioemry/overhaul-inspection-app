-- AlterTable
ALTER TABLE "tanks" ADD COLUMN     "ai_extracted_at" TIMESTAMP(3),
ADD COLUMN     "ai_extraction_meta" JSONB;

-- CreateTable
CREATE TABLE "tank_attachments" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "file_storage_id" TEXT NOT NULL,
    "attachment_url" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tank_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tank_attachments_tank_id_idx" ON "tank_attachments"("tank_id");

-- CreateIndex
CREATE INDEX "tank_attachments_file_storage_id_idx" ON "tank_attachments"("file_storage_id");

-- CreateIndex
CREATE INDEX "tank_attachments_deleted_at_idx" ON "tank_attachments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "tank_attachments_tank_id_file_storage_id_key" ON "tank_attachments"("tank_id", "file_storage_id");

-- AddForeignKey
ALTER TABLE "tank_attachments" ADD CONSTRAINT "tank_attachments_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_attachments" ADD CONSTRAINT "tank_attachments_file_storage_id_fkey" FOREIGN KEY ("file_storage_id") REFERENCES "file_storages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
