-- Undo for 04_constraints.sql: drops the unique enrollment index and the foreign keys, restores the old payout FK.
BEGIN;

DROP INDEX IF EXISTS "Enrollment_studentId_courseId_key";

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT IF EXISTS "PasswordResetToken_userId_fkey";
ALTER TABLE "AccountActivationToken" DROP CONSTRAINT IF EXISTS "AccountActivationToken_userId_fkey";
ALTER TABLE "SessionRegistration" DROP CONSTRAINT IF EXISTS "SessionRegistration_sessionId_fkey";
ALTER TABLE "SessionRegistration" DROP CONSTRAINT IF EXISTS "SessionRegistration_studentId_fkey";
ALTER TABLE "AmbassadorProfile" DROP CONSTRAINT IF EXISTS "AmbassadorProfile_userId_fkey";
ALTER TABLE "Subscription" DROP CONSTRAINT IF EXISTS "Subscription_userId_fkey";
ALTER TABLE "TeacherProfile" DROP CONSTRAINT IF EXISTS "TeacherProfile_userId_fkey";
ALTER TABLE "FacultyPayout" DROP CONSTRAINT IF EXISTS "FacultyPayout_teacherProfileId_fkey";
ALTER TABLE "FacultyPayout" ADD CONSTRAINT "FacultyPayout_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_teacherId_fkey";
ALTER TABLE "LiveSession" DROP CONSTRAINT IF EXISTS "LiveSession_courseId_fkey";
ALTER TABLE "LiveSession" DROP CONSTRAINT IF EXISTS "LiveSession_teacherId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_studentId_fkey";
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_courseId_fkey";
ALTER TABLE "PendingOperation" DROP CONSTRAINT IF EXISTS "PendingOperation_userId_fkey";
ALTER TABLE "CommissionEntry" DROP CONSTRAINT IF EXISTS "CommissionEntry_ambassadorId_fkey";
ALTER TABLE "CommissionEntry" DROP CONSTRAINT IF EXISTS "CommissionEntry_operationId_fkey";

COMMIT;
