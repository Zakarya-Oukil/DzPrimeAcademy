-- Phase 4, step 1 of 1: ADDITIVE ONLY. Safe on live, re-runnable. Run after the phase 2 and 3 steps, BEFORE deploying the code.
-- tokenVersion: login tokens carry it; logout and password changes bump it so old tokens stop working.
-- mustChangePassword: set for accounts created by staff with a generated password.
-- Undo with 01_rollback.sql. Take a Supabase backup first.
BEGIN;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

COMMIT;
