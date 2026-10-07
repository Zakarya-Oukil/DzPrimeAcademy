-- Undo for 02_constraints.sql: drops the five foreign keys. (Rows deleted by step 2 are not restored.)
BEGIN;

ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_authorId_fkey";
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_postId_fkey";
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_userId_fkey";
ALTER TABLE "PostComment" DROP CONSTRAINT IF EXISTS "PostComment_postId_fkey";
ALTER TABLE "PostComment" DROP CONSTRAINT IF EXISTS "PostComment_authorId_fkey";

COMMIT;
