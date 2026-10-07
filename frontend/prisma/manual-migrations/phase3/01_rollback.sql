-- Undo for 01_additive.sql. Drops PostLike (and its rows) and the new columns (and their data, e.g. image URLs).
-- Run 02_rollback.sql first if step 2 was applied.
BEGIN;

DROP TABLE IF EXISTS "PostLike";
DROP INDEX IF EXISTS "Post_authorId_idx";

ALTER TABLE "Bundle" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "Course" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "authorAvatar";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "isPrivate";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "linkUrl";
ALTER TABLE "Post" DROP COLUMN IF EXISTS "videoUrl";
ALTER TABLE "PostComment" DROP COLUMN IF EXISTS "authorAvatar";

COMMIT;
