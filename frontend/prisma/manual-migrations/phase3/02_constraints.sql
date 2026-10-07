-- Phase 3, step 2 of 2: foreign keys for posts, comments and likes. Re-runnable. Run after 01_additive.sql.
-- The first block DELETES posts, comments and likes that point at a user or post that no longer exists
-- (the community used to live in server memory, so on live these tables are normally empty; check the counts first):
--   SELECT (SELECT count(*) FROM "Post") posts, (SELECT count(*) FROM "PostComment") comments;
-- Not reversible except from the backup. Undo of the constraints themselves: 02_rollback.sql.
-- Locking: FKs are added NOT VALID (instant) and validated afterwards, as in phase 2 step 4.
BEGIN;
SET LOCAL lock_timeout = '5s';  -- if a long query holds "User", fail fast instead of queueing every login behind this

DELETE FROM "PostLike" l WHERE NOT EXISTS (SELECT 1 FROM "Post" p WHERE p.id = l."postId") OR NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = l."userId");
DELETE FROM "PostComment" c WHERE NOT EXISTS (SELECT 1 FROM "Post" p WHERE p.id = c."postId") OR NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = c."authorId");
DELETE FROM "Post" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."authorId");

ALTER TABLE "Post" DROP CONSTRAINT IF EXISTS "Post_authorId_fkey";
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_postId_fkey";
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PostLike" DROP CONSTRAINT IF EXISTS "PostLike_userId_fkey";
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PostComment" DROP CONSTRAINT IF EXISTS "PostComment_postId_fkey";
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PostComment" DROP CONSTRAINT IF EXISTS "PostComment_authorId_fkey";
ALTER TABLE "PostComment" ADD CONSTRAINT "PostComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

COMMIT;

ALTER TABLE "Post" VALIDATE CONSTRAINT "Post_authorId_fkey";
ALTER TABLE "PostLike" VALIDATE CONSTRAINT "PostLike_postId_fkey";
ALTER TABLE "PostLike" VALIDATE CONSTRAINT "PostLike_userId_fkey";
ALTER TABLE "PostComment" VALIDATE CONSTRAINT "PostComment_postId_fkey";
ALTER TABLE "PostComment" VALIDATE CONSTRAINT "PostComment_authorId_fkey";
