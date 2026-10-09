-- Phase 7, step 1 (run once in the Supabase SQL editor, AFTER a backup): admin-managed teacher cards for the landing page.
--  * "TeacherProfile"."showOnLanding": admins switch a teacher on; every existing teacher starts hidden.
--  * "landingOrder": sort position on the landing page (lowest first).
--  * "publicBio": short public text (max 400 chars, checked by the API).
--  * "photoUrl": photo uploaded through the admin Faculty tab (Supabase Storage, kind "teacher").
-- Undo: 01_rollback.sql
begin;

alter table "TeacherProfile" add column "showOnLanding" boolean not null default false;
alter table "TeacherProfile" add column "landingOrder" integer not null default 0;
alter table "TeacherProfile" add column "publicBio" text;
alter table "TeacherProfile" add column "photoUrl" text;

commit;
