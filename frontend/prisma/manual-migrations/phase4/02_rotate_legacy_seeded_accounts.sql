-- Phase 4, step 2 (run once on live, after step 1): the OLD seeding code created two staff accounts with passwords
-- taken from ADMIN_PASSWORD or hard-coded fallbacks that were visible in the source ('AdminGeneral2026!',
-- 'Commercial2026!'). Removing that code does not remove those rows. This makes their passwords unusable and ends
-- their logins; each person then sets a new password through "Forgot password", or delete the account in the admin.
--
-- 1) look first (it only reads):
--   SELECT id, email, role, "adminRole", "createdAt" FROM "User"
--    WHERE email IN ('general.admin@dzprime.academy', 'commercial@dzprime.academy');
-- 2) then run the update below. Rows that do not exist are simply skipped.
-- Also rotate ADMIN_PASSWORD in your environment: the owner account was created with that same value.
-- Undo: not reversible (the old passwords are gone on purpose); reset them with "Forgot password".
BEGIN;

UPDATE "User"
   SET "passwordHash" = NULL,
       "tokenVersion" = "tokenVersion" + 1
 WHERE email IN ('general.admin@dzprime.academy', 'commercial@dzprime.academy');

COMMIT;
