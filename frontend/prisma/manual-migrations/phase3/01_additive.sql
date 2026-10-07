-- Phase 3, step 1 of 2: ADDITIVE ONLY (new columns, new PostLike table, indexes). Safe on live. Re-runnable.
-- Run the phase 2 steps first so the order matches the code. Undo with 01_rollback.sql.
-- Take a Supabase backup before running.
BEGIN;

ALTER TABLE "Bundle" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "authorAvatar" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "isPrivate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "linkUrl" TEXT;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "PostComment" ADD COLUMN IF NOT EXISTS "authorAvatar" TEXT;

CREATE TABLE IF NOT EXISTS "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PostLike_userId_idx" ON "PostLike"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "PostLike_postId_userId_key" ON "PostLike"("postId", "userId");
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId");

COMMIT;
