-- Phase 2, step 3 of 4: DATA CLEANUP. THIS DELETES ROWS. Run only after 01 and after reading 02_preview.sql output.
-- Not reversible by a rollback script: restore from the Supabase backup if you need the rows back.
-- It removes only rows that point at something that no longer exists (orphans) and duplicate enrollments
-- (keeps the one with the most progress). It never touches users, courses, bundles, money rows or negative amounts.
BEGIN;

-- Duplicate enrollments: keep the one with the most progress (oldest on a tie) per (student, course)
DELETE FROM "Enrollment" e USING "Enrollment" k
 WHERE e."studentId" = k."studentId" AND e."courseId" = k."courseId" AND e.id <> k.id
   AND (k."progressPercent" > e."progressPercent"
        OR (k."progressPercent" = e."progressPercent" AND (k."createdAt", k.id) < (e."createdAt", e.id)));

-- Orphans of a deleted user / course / session / profile
DELETE FROM "Enrollment" e WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = e."studentId") OR NOT EXISTS (SELECT 1 FROM "Course" c WHERE c.id = e."courseId");
DELETE FROM "FacultyPayout" f WHERE NOT EXISTS (SELECT 1 FROM "TeacherProfile" t WHERE t.id = f."teacherProfileId");
DELETE FROM "TeacherProfile" t WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = t."userId");
DELETE FROM "AmbassadorProfile" a WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = a."userId");
DELETE FROM "Subscription" s WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."userId");
DELETE FROM "Session" s WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."userId");
DELETE FROM "PasswordResetToken" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId");
DELETE FROM "AccountActivationToken" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId");
DELETE FROM "SessionRegistration" r WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = r."studentId") OR NOT EXISTS (SELECT 1 FROM "LiveSession" s WHERE s.id = r."sessionId");

-- Dangling optional links become NULL (the row stays)
UPDATE "Course" c SET "teacherId" = NULL WHERE c."teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = c."teacherId");
UPDATE "LiveSession" s SET "teacherId" = NULL WHERE s."teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."teacherId");
UPDATE "LiveSession" s SET "courseId" = NULL WHERE s."courseId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Course" c WHERE c.id = s."courseId");
UPDATE "PendingOperation" o SET "userId" = NULL WHERE o."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = o."userId");

COMMIT;
