-- Phase 2, step 2 of 4: READ-ONLY report. Changes nothing. Run it and look at the counts before step 3.
-- Every row listed here is something step 4 (foreign keys / unique index) would otherwise reject.
SELECT 'enrollment duplicates (same student+course)' AS check, count(*) AS rows FROM (
  SELECT 1 FROM "Enrollment" GROUP BY "studentId","courseId" HAVING count(*) > 1) d
UNION ALL SELECT 'enrollment with missing student', count(*) FROM "Enrollment" e WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = e."studentId")
UNION ALL SELECT 'enrollment with missing course', count(*) FROM "Enrollment" e WHERE NOT EXISTS (SELECT 1 FROM "Course" c WHERE c.id = e."courseId")
UNION ALL SELECT 'teacher profile with missing user', count(*) FROM "TeacherProfile" t WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = t."userId")
UNION ALL SELECT 'ambassador profile with missing user', count(*) FROM "AmbassadorProfile" a WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = a."userId")
UNION ALL SELECT 'subscription with missing user', count(*) FROM "Subscription" s WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."userId")
UNION ALL SELECT 'session (login) with missing user', count(*) FROM "Session" s WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."userId")
UNION ALL SELECT 'reset token with missing user', count(*) FROM "PasswordResetToken" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId")
UNION ALL SELECT 'activation token with missing user', count(*) FROM "AccountActivationToken" p WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = p."userId")
UNION ALL SELECT 'live-session registration with missing student', count(*) FROM "SessionRegistration" r WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = r."studentId")
UNION ALL SELECT 'live-session registration with missing session', count(*) FROM "SessionRegistration" r WHERE NOT EXISTS (SELECT 1 FROM "LiveSession" s WHERE s.id = r."sessionId")
UNION ALL SELECT 'payout with missing teacher profile', count(*) FROM "FacultyPayout" f WHERE NOT EXISTS (SELECT 1 FROM "TeacherProfile" t WHERE t.id = f."teacherProfileId")
UNION ALL SELECT 'course whose teacherId is not a user (will be set to NULL)', count(*) FROM "Course" c WHERE c."teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = c."teacherId")
UNION ALL SELECT 'live session whose teacherId is not a user (set to NULL)', count(*) FROM "LiveSession" s WHERE s."teacherId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = s."teacherId")
UNION ALL SELECT 'live session whose courseId is not a course (set to NULL)', count(*) FROM "LiveSession" s WHERE s."courseId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Course" c WHERE c.id = s."courseId")
UNION ALL SELECT 'operation whose userId is not a user (set to NULL)', count(*) FROM "PendingOperation" o WHERE o."userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = o."userId")
UNION ALL SELECT 'NEGATIVE amounts: operations (kept, reported only)', count(*) FROM "PendingOperation" WHERE "amountDzd" < 0
UNION ALL SELECT 'NEGATIVE prices: courses (kept, reported only)', count(*) FROM "Course" WHERE "priceDzd" < 0
UNION ALL SELECT 'NEGATIVE prices: bundles (kept, reported only)', count(*) FROM "Bundle" WHERE "originalPriceDzd" < 0 OR "currentPriceDzd" < 0
UNION ALL SELECT 'legacy mock bundle purchases (kept, no longer counted as revenue)', count(*) FROM "BundlePurchase" WHERE "paymentStatus" = 'MOCK_SUCCESS'
UNION ALL SELECT 'OPEN (PENDING) priced operations created before this release: amount was chosen by the client, review each one by hand before approving', count(*) FROM "PendingOperation" WHERE "status" = 'PENDING' AND "amountDzd" > 0;
