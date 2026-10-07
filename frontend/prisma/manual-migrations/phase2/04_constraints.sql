-- Phase 2, step 4 of 4: unique enrollment index + foreign keys. Run only after 03_cleanup.sql. Re-runnable.
-- Locking: the FKs are added NOT VALID inside the transaction (instant), then VALIDATE runs afterwards as separate
-- statements (they only take a light lock and let normal reads and writes continue). Run it in a quiet period anyway.
-- If VALIDATE fails, rows were created between steps 3 and 4: run 03 again, then re-run this file.
-- Undo with 04_rollback.sql.
BEGIN;
SET LOCAL lock_timeout = '5s';  -- if a long query holds "User", fail fast instead of queueing every login behind this

CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_studentId_courseId_key" ON "Enrollment"("studentId", "courseId");

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT IF EXISTS "PasswordResetToken_userId_fkey";
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "AccountActivationToken" DROP CONSTRAINT IF EXISTS "AccountActivationToken_userId_fkey";
ALTER TABLE "AccountActivationToken" ADD CONSTRAINT "AccountActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "SessionRegistration" DROP CONSTRAINT IF EXISTS "SessionRegistration_sessionId_fkey";
ALTER TABLE "SessionRegistration" ADD CONSTRAINT "SessionRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LiveSession"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "SessionRegistration" DROP CONSTRAINT IF EXISTS "SessionRegistration_studentId_fkey";
ALTER TABLE "SessionRegistration" ADD CONSTRAINT "SessionRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "AmbassadorProfile" DROP CONSTRAINT IF EXISTS "AmbassadorProfile_userId_fkey";
ALTER TABLE "AmbassadorProfile" ADD CONSTRAINT "AmbassadorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "TeacherProfile" DROP CONSTRAINT IF EXISTS "TeacherProfile_userId_fkey";
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "FacultyPayout" DROP CONSTRAINT IF EXISTS "FacultyPayout_teacherProfileId_fkey";
ALTER TABLE "FacultyPayout" ADD CONSTRAINT "FacultyPayout_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_teacherId_fkey";
ALTER TABLE "Course" ADD CONSTRAINT "Course_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "LiveSession" DROP CONSTRAINT IF EXISTS "LiveSession_courseId_fkey";
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "LiveSession" DROP CONSTRAINT IF EXISTS "LiveSession_teacherId_fkey";
ALTER TABLE "LiveSession" ADD CONSTRAINT "LiveSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_studentId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_courseId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "PendingOperation" DROP CONSTRAINT IF EXISTS "PendingOperation_userId_fkey";
ALTER TABLE "PendingOperation" ADD CONSTRAINT "PendingOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE NOT VALID;
ALTER TABLE "CommissionEntry" DROP CONSTRAINT IF EXISTS "CommissionEntry_ambassadorId_fkey";
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_ambassadorId_fkey" FOREIGN KEY ("ambassadorId") REFERENCES "AmbassadorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;
ALTER TABLE "CommissionEntry" DROP CONSTRAINT IF EXISTS "CommissionEntry_operationId_fkey";
ALTER TABLE "CommissionEntry" ADD CONSTRAINT "CommissionEntry_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "PendingOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE NOT VALID;

COMMIT;

ALTER TABLE "Session" VALIDATE CONSTRAINT "Session_userId_fkey";
ALTER TABLE "PasswordResetToken" VALIDATE CONSTRAINT "PasswordResetToken_userId_fkey";
ALTER TABLE "AccountActivationToken" VALIDATE CONSTRAINT "AccountActivationToken_userId_fkey";
ALTER TABLE "SessionRegistration" VALIDATE CONSTRAINT "SessionRegistration_sessionId_fkey";
ALTER TABLE "SessionRegistration" VALIDATE CONSTRAINT "SessionRegistration_studentId_fkey";
ALTER TABLE "AmbassadorProfile" VALIDATE CONSTRAINT "AmbassadorProfile_userId_fkey";
ALTER TABLE "Subscription" VALIDATE CONSTRAINT "Subscription_userId_fkey";
ALTER TABLE "TeacherProfile" VALIDATE CONSTRAINT "TeacherProfile_userId_fkey";
ALTER TABLE "FacultyPayout" VALIDATE CONSTRAINT "FacultyPayout_teacherProfileId_fkey";
ALTER TABLE "Course" VALIDATE CONSTRAINT "Course_teacherId_fkey";
ALTER TABLE "LiveSession" VALIDATE CONSTRAINT "LiveSession_courseId_fkey";
ALTER TABLE "LiveSession" VALIDATE CONSTRAINT "LiveSession_teacherId_fkey";
ALTER TABLE "Enrollment" VALIDATE CONSTRAINT "Enrollment_studentId_fkey";
ALTER TABLE "Enrollment" VALIDATE CONSTRAINT "Enrollment_courseId_fkey";
ALTER TABLE "PendingOperation" VALIDATE CONSTRAINT "PendingOperation_userId_fkey";
ALTER TABLE "CommissionEntry" VALIDATE CONSTRAINT "CommissionEntry_ambassadorId_fkey";
ALTER TABLE "CommissionEntry" VALIDATE CONSTRAINT "CommissionEntry_operationId_fkey";

-- Optional, run later by hand once 02_preview.sql shows 0 NEGATIVE rows (otherwise it errors, harmlessly):
-- ALTER TABLE "PendingOperation" VALIDATE CONSTRAINT "PendingOperation_amount_nonneg";
-- ALTER TABLE "Course" VALIDATE CONSTRAINT "Course_price_nonneg";
-- ALTER TABLE "Bundle" VALIDATE CONSTRAINT "Bundle_price_nonneg";
