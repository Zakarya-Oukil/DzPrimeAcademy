-- Undo for 01_additive.sql. Only run if step 1 must be reverted. Drops the two new tables (and any rows in them),
-- the new columns and the new indexes/constraints. Run 04_rollback.sql first if step 4 was already applied.
BEGIN;

ALTER TABLE "PendingOperation" DROP CONSTRAINT IF EXISTS "PendingOperation_amount_nonneg";
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_price_nonneg";
ALTER TABLE "Bundle" DROP CONSTRAINT IF EXISTS "Bundle_price_nonneg";

DROP TABLE IF EXISTS "CommissionEntry";
DROP TABLE IF EXISTS "Promotion";

DROP INDEX IF EXISTS "BundlePurchase_operationId_key";
ALTER TABLE "BundlePurchase" DROP COLUMN IF EXISTS "operationId";
ALTER TABLE "BundlePurchase" ALTER COLUMN "paymentStatus" SET DEFAULT 'MOCK_SUCCESS';
ALTER TABLE "PendingOperation" DROP COLUMN IF EXISTS "discountDzd";
ALTER TABLE "PendingOperation" DROP COLUMN IF EXISTS "promoCode";

DROP INDEX IF EXISTS "AccountActivationToken_userId_idx";
DROP INDEX IF EXISTS "BundlePurchase_userId_idx";
DROP INDEX IF EXISTS "Course_teacherId_idx";
DROP INDEX IF EXISTS "Enrollment_courseId_idx";
DROP INDEX IF EXISTS "Exam_moduleId_idx";
DROP INDEX IF EXISTS "FacultyPayout_teacherProfileId_idx";
DROP INDEX IF EXISTS "FacultyPayout_status_idx";
DROP INDEX IF EXISTS "LiveSession_teacherId_idx";
DROP INDEX IF EXISTS "LiveSession_scheduledAt_idx";
DROP INDEX IF EXISTS "Module_academicYearId_idx";
DROP INDEX IF EXISTS "PasswordResetToken_userId_idx";
DROP INDEX IF EXISTS "PendingOperation_status_createdAt_idx";
DROP INDEX IF EXISTS "PendingOperation_userId_idx";
DROP INDEX IF EXISTS "Post_createdAt_idx";
DROP INDEX IF EXISTS "PostComment_postId_idx";
DROP INDEX IF EXISTS "Rating_ambassadorId_idx";
DROP INDEX IF EXISTS "Session_userId_idx";
DROP INDEX IF EXISTS "Session_expiresAt_idx";
DROP INDEX IF EXISTS "SessionRegistration_studentId_idx";
DROP INDEX IF EXISTS "Subscription_userId_idx";
DROP INDEX IF EXISTS "User_role_idx";

COMMIT;
