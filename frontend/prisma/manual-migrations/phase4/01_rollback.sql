-- Undo for 01_additive.sql. Run only after the phase 4 code is rolled back (the code reads these columns).
BEGIN;

ALTER TABLE "User" DROP COLUMN IF EXISTS "tokenVersion";
ALTER TABLE "User" DROP COLUMN IF EXISTS "mustChangePassword";

COMMIT;
