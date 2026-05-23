-- CreateEnum
CREATE TYPE "FollowStatus" AS ENUM ('NONE', 'PENDING', 'ACCEPTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_ACCEPT';

-- AlterTable
ALTER TABLE "followings" ADD COLUMN     "accepted_at" TIMESTAMP(3),
ADD COLUMN     "status" "FollowStatus" NOT NULL DEFAULT 'ACCEPTED';

-- CreateIndex
CREATE INDEX "followings_following_id_status_idx" ON "followings"("following_id", "status");
