-- Phase 2, step 1 of 4: ADDITIVE ONLY. Safe to run on live: it adds, never deletes or rewrites rows.
-- Adds: Promotion + CommissionEntry tables, PendingOperation.promoCode/discountDzd,
-- BundlePurchase.operationId, query indexes, and CHECK constraints (NOT VALID = applies to new rows only).
-- Undo with 01_rollback.sql. Take a Supabase backup before step 1.
BEGIN;

ALTER TABLE "BundlePurchase" ADD COLUMN IF NOT EXISTS "operationId" TEXT;
ALTER TABLE "BundlePurchase" ALTER COLUMN "paymentStatus" SET DEFAULT 'APPROVED_BY_ADMIN';
ALTER TABLE "PendingOperation" ADD COLUMN IF NOT EXISTS "discountDzd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PendingOperation" ADD COLUMN IF NOT EXISTS "promoCode" TEXT;

CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionFr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'CAMPAIGN',
    "applicableTrack" TEXT NOT NULL DEFAULT 'ALL',
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommissionEntry" (
    "id" TEXT NOT NULL,
    "ambassadorId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "amountDzd" INTEGER NOT NULL,
    "ratePercent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommissionEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Promotion_code_key" ON "Promotion"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "CommissionEntry_operationId_key" ON "CommissionEntry"("operationId");
CREATE INDEX IF NOT EXISTS "CommissionEntry_ambassadorId_idx" ON "CommissionEntry"("ambassadorId");
CREATE UNIQUE INDEX IF NOT EXISTS "BundlePurchase_operationId_key" ON "BundlePurchase"("operationId");
CREATE INDEX IF NOT EXISTS "AccountActivationToken_userId_idx" ON "AccountActivationToken"("userId");
CREATE INDEX IF NOT EXISTS "BundlePurchase_userId_idx" ON "BundlePurchase"("userId");
CREATE INDEX IF NOT EXISTS "Course_teacherId_idx" ON "Course"("teacherId");
CREATE INDEX IF NOT EXISTS "Enrollment_courseId_idx" ON "Enrollment"("courseId");
CREATE INDEX IF NOT EXISTS "Exam_moduleId_idx" ON "Exam"("moduleId");
CREATE INDEX IF NOT EXISTS "FacultyPayout_teacherProfileId_idx" ON "FacultyPayout"("teacherProfileId");
CREATE INDEX IF NOT EXISTS "FacultyPayout_status_idx" ON "FacultyPayout"("status");
CREATE INDEX IF NOT EXISTS "LiveSession_teacherId_idx" ON "LiveSession"("teacherId");
CREATE INDEX IF NOT EXISTS "LiveSession_scheduledAt_idx" ON "LiveSession"("scheduledAt");
CREATE INDEX IF NOT EXISTS "Module_academicYearId_idx" ON "Module"("academicYearId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PendingOperation_status_createdAt_idx" ON "PendingOperation"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PendingOperation_userId_idx" ON "PendingOperation"("userId");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "PostComment_postId_idx" ON "PostComment"("postId");
CREATE INDEX IF NOT EXISTS "Rating_ambassadorId_idx" ON "Rating"("ambassadorId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX IF NOT EXISTS "SessionRegistration_studentId_idx" ON "SessionRegistration"("studentId");
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- The three campaigns that used to live in a memory array. Usage starts at 0 (the old 142/89/57 were invented).
INSERT INTO "Promotion" ("id","code","discountPercent","descriptionAr","descriptionFr","type","applicableTrack") VALUES
 ('promo-1','PROMO2026',25,'تخفيض الافتتاح الوطني الرسمي 2026','Remise officielle d''ouverture nationale 2026','CAMPAIGN','ALL'),
 ('promo-2','BAC20',20,'عرض خاص لطلبة البكالوريا BAC 2026','Offre spéciale candidats BAC 2026','CAMPAIGN','BAC'),
 ('promo-3','EXCELLENCE30',30,'عرض حزم الامتياز الجامعي والماستر','Pack Excellence Universitaire & Master','FLASH_SALE','UNIVERSITY_LMD')
ON CONFLICT ("code") DO NOTHING;

-- NOT VALID: enforced for new/updated rows now; old rows are reported by 02 and validated in step 4.
ALTER TABLE "PendingOperation" DROP CONSTRAINT IF EXISTS "PendingOperation_amount_nonneg";
ALTER TABLE "PendingOperation" ADD CONSTRAINT "PendingOperation_amount_nonneg" CHECK ("amountDzd" >= 0 AND "discountDzd" >= 0) NOT VALID;
ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_price_nonneg";
ALTER TABLE "Course" ADD CONSTRAINT "Course_price_nonneg" CHECK ("priceDzd" >= 0) NOT VALID;
ALTER TABLE "Bundle" DROP CONSTRAINT IF EXISTS "Bundle_price_nonneg";
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_price_nonneg" CHECK ("originalPriceDzd" >= 0 AND "currentPriceDzd" >= 0) NOT VALID;
ALTER TABLE "Promotion" DROP CONSTRAINT IF EXISTS "Promotion_percent_range";
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_percent_range" CHECK ("discountPercent" BETWEEN 1 AND 100) NOT VALID;

COMMIT;
