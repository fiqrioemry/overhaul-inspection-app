-- AlterEnum: add REPOST value to NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'REPOST';

-- AlterTable: add repost columns to posts
ALTER TABLE "posts" ADD COLUMN "is_repost" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "posts" ADD COLUMN "original_post_id" TEXT;
ALTER TABLE "posts" ADD COLUMN "share_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN "caption" TEXT;

-- CreateIndex: posts.original_post_id
CREATE INDEX "posts_original_post_id_idx" ON "posts"("original_post_id");

-- AddForeignKey: posts.original_post_id -> posts.id
ALTER TABLE "posts" ADD CONSTRAINT "posts_original_post_id_fkey"
  FOREIGN KEY ("original_post_id") REFERENCES "posts"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: message_reactions
CREATE TABLE "message_reactions" (
    "id"         TEXT        NOT NULL,
    "message_id" TEXT        NOT NULL,
    "user_id"    TEXT        NOT NULL,
    "emoji"      TEXT        NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: message_reactions unique constraint
ALTER TABLE "message_reactions"
  ADD CONSTRAINT "message_reactions_message_id_user_id_emoji_key"
  UNIQUE ("message_id", "user_id", "emoji");

-- CreateIndex: message_reactions.message_id
CREATE INDEX "message_reactions_message_id_idx" ON "message_reactions"("message_id");

-- AddForeignKey: message_reactions.message_id -> messages.id
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey"
  FOREIGN KEY ("message_id") REFERENCES "messages"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: message_reactions.user_id -> users.id
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
