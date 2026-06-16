/*
  Warnings:

  - You are about to drop the column `avatar` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[avatar_file_storage_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "file_storages_target_id_module_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar",
ADD COLUMN     "avatar_file_storage_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_file_storage_id_key" ON "users"("avatar_file_storage_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_file_storage_id_fkey" FOREIGN KEY ("avatar_file_storage_id") REFERENCES "file_storages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
